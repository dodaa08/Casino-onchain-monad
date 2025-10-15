import { Router } from "express";
import crypto from "crypto";
import logger from "../../utils/logger.js";
import { hmacSha256Hex } from "../../utils/logger.js";
import redisClient from "../../config/redisClient.js";
const SessionRouter = Router();
function sha256Hex(input) {
    return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}
function generateBoard(serverSeed, numRows = 12) {
    const rows = [];
    for (let i = 0; i < numRows; i++) {
        // Deterministic tile count per row (2-7 tiles)
        const hash = sha256Hex(`${serverSeed}:board:${i}`);
        const tiles = 2 + (parseInt(hash.slice(0, 2), 16) % 6);
        rows.push(tiles);
    }
    return rows;
}
// POST /api/sessions/start
// Body: { walletAddress: string, clientSeed: string, numRows?: number }
const StartSession = async (req, res) => {
    try {
        const walletAddressRaw = (req.body?.walletAddress || "").toString();
        const clientSeed = (req.body?.clientSeed || "").toString();
        const numRows = parseInt(req.body?.numRows) || 12;
        if (!walletAddressRaw || !clientSeed) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }
        const ownerWallet = walletAddressRaw.toLowerCase();
        // Generate deterministic serverCommit using HMAC
        const sessionId = crypto.randomUUID();
        const master = process.env.MASTER_SECRET || "";
        if (!master)
            return res.status(500).json({ success: false, message: "Server misconfigured" });
        const serverSeed = hmacSha256Hex(master, sessionId);
        const serverCommit = sha256Hex(serverSeed);
        // Generate deterministic board layout
        const rows = generateBoard(serverSeed, numRows);
        const rowsHash = sha256Hex(JSON.stringify(rows));
        // Store session in Redis with 24h TTL
        const sessionData = {
            sessionId,
            ownerWallet,
            serverCommit,
            serverSeed: null, // only stored after reveal
            clientSeed,
            rowsHash,
            rows,
            status: "open",
            lastRowIndex: -1,
            createdAt: new Date().toISOString(),
        };
        await redisClient.setEx(`session:${sessionId}`, 86400, JSON.stringify(sessionData));
        // Also store wallet->sessionId mapping for quick lookup
        await redisClient.setEx(`wallet:${ownerWallet}:active`, 86400, sessionId);
        logger.info("[Session] start", { ownerWallet, sessionId });
        return res.status(200).json({
            success: true,
            sessionId,
            serverCommit,
            rows,
            rowsHash,
            algorithmVersion: "v1",
        });
    }
    catch (error) {
        logger.error("[Session] start error", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
SessionRouter.post("/start", StartSession);
const RevealSession = async (req, res) => {
    try {
        const sessionId = req.params.id?.toString();
        if (!sessionId)
            return res.status(400).json({ success: false, message: "Missing sessionId" });
        // Get session from Redis
        const sessionDataStr = await redisClient.get(`session:${sessionId}`);
        if (!sessionDataStr)
            return res.status(404).json({ success: false, message: "Session not found" });
        const s = JSON.parse(sessionDataStr);
        if (s.status !== "open")
            return res.status(409).json({ success: false, message: "Already revealed" });
        const master = process.env.MASTER_SECRET || "";
        if (!master)
            return res.status(500).json({ success: false, message: "Server misconfigured" });
        // Derive serverSeed deterministically
        const serverSeed = hmacSha256Hex(master, sessionId);
        const serverCommit = sha256Hex(serverSeed);
        if (serverCommit !== s.serverCommit) {
            return res.status(500).json({ success: false, message: "Commit mismatch" });
        }
        // Update session in Redis
        s.serverSeed = serverSeed;
        s.status = "revealed";
        s.revealedAt = new Date().toISOString();
        await redisClient.setEx(`session:${sessionId}`, 86400, JSON.stringify(s));
        return res.status(200).json({ success: true });
    }
    catch (e) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
// GET /api/sessions/:id/proof
const GetProof = async (req, res) => {
    try {
        const sessionId = req.params.id?.toString();
        if (!sessionId)
            return res.status(400).json({ success: false, message: "Missing sessionId" });
        // Get session from Redis
        const sessionDataStr = await redisClient.get(`session:${sessionId}`);
        if (!sessionDataStr)
            return res.status(404).json({ success: false, message: "Session not found" });
        const s = JSON.parse(sessionDataStr);
        // Load clicks from Redis (using existing cache pattern)
        let clicks = [];
        try {
            // Get all row data for this session
            const keys = await redisClient.keys(`game:${sessionId}:row:*:*`);
            for (const key of keys) {
                const parts = key.split(':');
                const rowIndex = parseInt(parts[3] || '0');
                const action = parts[4]; // 'clicked' or 'death'
                if (action === 'clicked') {
                    const clicked = await redisClient.get(key);
                    if (clicked !== null) {
                        clicks.push({ row: rowIndex, tile: parseInt(clicked), isDeath: false });
                    }
                }
                else if (action === 'death') {
                    const death = await redisClient.get(key);
                    if (death !== null) {
                        clicks.push({ row: rowIndex, tile: parseInt(death), isDeath: true });
                    }
                }
            }
            clicks.sort((a, b) => a.row - b.row);
        }
        catch (error) {
            logger.warn("[Session] proof clicks not available", { sessionId });
        }
        return res.status(200).json({
            success: true,
            proof: {
                sessionId: s.sessionId,
                algorithmVersion: "v1",
                serverCommit: s.serverCommit,
                serverSeed: s.serverSeed || null,
                clientSeed: s.clientSeed,
                rows: s.rows ?? undefined,
                rowsHash: s.rowsHash,
                clicks: clicks,
                createdAt: s.createdAt,
                revealedAt: s.revealedAt || null,
            },
        });
    }
    catch (e) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
// GET /api/sessions/:id/restore - Get session data for frontend state restoration
const RestoreSession = async (req, res) => {
    try {
        const sessionId = req.params.id?.toString();
        if (!sessionId)
            return res.status(400).json({ success: false, message: "Missing sessionId" });
        // Get session from Redis
        const sessionDataStr = await redisClient.get(`session:${sessionId}`);
        if (!sessionDataStr)
            return res.status(404).json({ success: false, message: "Session not found" });
        const s = JSON.parse(sessionDataStr);
        // Get current game state from Redis
        const roundEnded = await redisClient.get(`game:${sessionId}:roundEnded`);
        const isPlaying = await redisClient.get(`game:${sessionId}:isPlaying`);
        const rowIndex = await redisClient.get(`game:${sessionId}:rowIndex`);
        return res.status(200).json({
            success: true,
            session: {
                sessionId: s.sessionId,
                serverCommit: s.serverCommit,
                clientSeed: s.clientSeed,
                rows: s.rows,
                rowsHash: s.rowsHash,
                algorithmVersion: "v1",
                status: s.status,
                lastRowIndex: s.lastRowIndex,
                createdAt: s.createdAt,
                revealedAt: s.revealedAt,
            },
            gameState: {
                roundEnded: roundEnded === "true",
                isPlaying: isPlaying === "true",
                lastClickedRow: rowIndex ? Number(rowIndex) : null,
            }
        });
    }
    catch (e) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
SessionRouter.post("/:id/reveal", RevealSession);
SessionRouter.get("/:id/proof", GetProof);
SessionRouter.get("/:id/restore", RestoreSession);
export default SessionRouter;
//# sourceMappingURL=route.js.map