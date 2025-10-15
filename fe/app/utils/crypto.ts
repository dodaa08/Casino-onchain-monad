// Client-side cryptographic utilities for provably fair gaming
// These functions replicate the server-side logic for deterministic game outcomes

/**
 * Generate SHA-256 hash of input string
 */
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generate HMAC-SHA256 hash using key and message
 */
export async function hmacSha256Hex(key: string, message: string): Promise<string> {
  const keyData = new TextEncoder().encode(key);
  const messageData = new TextEncoder().encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generate a client seed (32 random bytes as hex string)
 */
export function generateClientSeed(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generate a server seed using HMAC with master secret and session ID
 * Note: This is for demonstration - in production, server seed should be generated server-side
 */
export async function generateServerSeed(sessionId: string, masterSecret: string = "demo-master-secret"): Promise<string> {
  return await hmacSha256Hex(masterSecret, sessionId);
}

/**
 * Generate server commit (SHA-256 of server seed)
 */
export async function generateServerCommit(serverSeed: string): Promise<string> {
  return await sha256Hex(serverSeed);
}

/**
 * Generate deterministic board layout using server seed
 */
export async function generateBoard(serverSeed: string, numRows: number = 12): Promise<number[]> {
  const rows: number[] = [];
  for (let i = 0; i < numRows; i++) {
    // Deterministic tile count per row (2-7 tiles)
    const hash = await sha256Hex(`${serverSeed}:board:${i}`);
    const tiles = 2 + (parseInt(hash.slice(0, 2), 16) % 6);
    rows.push(tiles);
  }
  return rows;
}

/**
 * Generate deterministic death tile index for a specific row
 */
export async function getDeathTileIndex(serverSeed: string, rowIdx: number, tiles: number): Promise<number> {
  const hash = await sha256Hex(`${serverSeed}-row${rowIdx}`);
  const n = parseInt(hash.slice(8, 16), 16);
  return tiles > 0 ? ((n % tiles) + 1) % tiles : 0;
}

/**
 * Generate rows hash for verification
 */
export async function generateRowsHash(rows: number[]): Promise<string> {
  return await sha256Hex(JSON.stringify(rows));
}
