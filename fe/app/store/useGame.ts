import { create } from "zustand";
import { cacheTile, StartSession } from "@/app/services/api";
import { generateClientSeed } from "@/app/utils/crypto";

type GameState = {
  isPlaying: boolean;
  roundEnded: boolean;
  diedOnDeathTile: boolean;
  sessionId: string;
  isDemo: boolean;
  rowIndex: number;
  tileIndex: number;
  setSessionId: (id: string) => void;
  Replay: boolean;
  shuffleBoard: boolean; // Flag to trigger board shuffling for any fresh start
  start: (walletAddress: string, isDemo: boolean) => void;
  endRound: () => void;
  setReplay: (replay: boolean) => void;
  setShuffleBoard: (shuffle: boolean) => void;
  selectTile: (row: number, tile: number, walletAddress: string, isDeath: boolean, rowMultiplier?: number, stakeOverride?: number) => Promise<void>;
  rehydrate: (p: Partial<Pick<GameState, "isPlaying" | "roundEnded" | "sessionId" | "rowIndex" | "tileIndex" | "cumulativePayoutAmount" | "diedOnDeathTile" | "initialStake" | "totalLoss">>) => void;
  setCumulativePayoutAmount: (amount: number) => void;
  payoutAmount : number;
  cumulativePayoutAmount: number;
  stake: number;
  cumulativeMultiplier: number;
  setStake: (s: number)=> void;
  initialStake: number;
  totalLoss: number;
  // Provably fair gaming properties
  clientSeed: string;
  serverSeed: string;
  serverCommit: string;
  rowsHash: string;
  setSeeds: (clientSeed: string, serverSeed: string, serverCommit: string, rowsHash: string) => void;
};



export const useGame = create<GameState>((set, get) => ({
  isPlaying: false,
  roundEnded: false,
  diedOnDeathTile: false,
  sessionId: "",
  isDemo: false,
  rowIndex: 0,
  tileIndex: 0,
  payoutAmount: 0,
  cumulativePayoutAmount: 0,
  stake: 1,
  cumulativeMultiplier: 1,
  initialStake: 0,
  totalLoss: 0,
  Replay: false,
  shuffleBoard: false,
  // Provably fair gaming properties
  clientSeed: "",
  serverSeed: "",
  serverCommit: "",
  rowsHash: "",
  setReplay: (replay) => set({ Replay: replay }),
  setShuffleBoard: (shuffle) => set({ shuffleBoard: shuffle }),
  setStake: (s) => set({ stake: s }),
  setSessionId: (id) => set({ sessionId: id }),
  setCumulativePayoutAmount: (amount) => set({ cumulativePayoutAmount: amount }),
  setSeeds: (clientSeed, serverSeed, serverCommit, rowsHash) => set({ 
    clientSeed, 
    serverSeed, 
    serverCommit, 
    rowsHash 
  }),
  
  start: async (walletAddress: string, isDemo: boolean) => {
    if (!walletAddress) {
      // Allow demo mode without wallet address
      if (!isDemo) return;
    }
    
    set({ isDemo }); // Set the demo status

    if (!isDemo) {
      try {
        // Generate client seed
        const clientSeed = generateClientSeed();
        
        // Create session via backend API (stores in Redis)
        const session = await StartSession(walletAddress, clientSeed, 12);
        
        set({ 
          sessionId: session.sessionId,
          clientSeed: clientSeed,
          serverSeed: "", // Will be retrieved from Redis when needed
          serverCommit: session.serverCommit,
          rowsHash: session.rowsHash,
          isPlaying: true, 
          roundEnded: false, 
          diedOnDeathTile: false, 
          payoutAmount: 0, 
          cumulativePayoutAmount: 0, 
          cumulativeMultiplier: 1,
          initialStake: get().stake,
          totalLoss: 0
        });
      } catch (error) {
        console.error('Failed to start session:', error);
        // Fallback to simple start without session but still not as a demo
        set({ 
          isPlaying: true, 
          roundEnded: false, 
          diedOnDeathTile: false, 
          payoutAmount: 0, 
          cumulativePayoutAmount: 0, 
          cumulativeMultiplier: 1,
          initialStake: get().stake,
          totalLoss: 0
        });
      }
    } else {
      // Handle demo mode start
      set({ 
        sessionId: "", // No session ID for demo
        clientSeed: generateClientSeed(),
        serverSeed: "",
        serverCommit: "",
        rowsHash: "",
        isPlaying: true, 
        roundEnded: false, 
        diedOnDeathTile: false, 
        payoutAmount: 0, 
        cumulativePayoutAmount: 0, 
        cumulativeMultiplier: 1,
        initialStake: get().stake,
        totalLoss: 0
      });
    }
  },
  endRound: () => set({ isPlaying: false, roundEnded: true }),

  selectTile: async (rowIndex, tileIndex, walletAddress, isDeath, rowMultiplier, stakeOverride) => {
    set({ rowIndex, tileIndex });
    const { sessionId, stake } = get();
    try {
      await cacheTile({
        sessionId,
        rowIndex,
        tileIndex,
        isDeath,
        roundEnded: isDeath,
        walletAddress,
      });

      if (isDeath) {
        const { initialStake, cumulativePayoutAmount } = get();
        const ethEarnings = cumulativePayoutAmount / 150;
        const totalLossAmount = initialStake + ethEarnings;
        
        set({ 
          isPlaying: false, 
          roundEnded: true, 
          diedOnDeathTile: true, 
          payoutAmount: 0,
          cumulativePayoutAmount: 0,
          totalLoss: totalLossAmount
        });
        return;
      }

      if (typeof rowMultiplier === "number") {
        const effectiveStake = typeof stakeOverride === "number" ? stakeOverride : stake;
        const newCumulativeMultiplier = rowMultiplier;
        const ethNow = Number((effectiveStake * newCumulativeMultiplier).toFixed(4));
        const deathPoints = Number((ethNow * 150).toFixed(2));
        set({
          cumulativeMultiplier: newCumulativeMultiplier,
          payoutAmount: ethNow,
          cumulativePayoutAmount: deathPoints,
        });
      }
    } catch (e) {
      console.error(e);
      console.error("[CACHE] tile cache failed", e);
    }
  },

  rehydrate: (p) => {
    set((prev) => ({
      isPlaying: p.isPlaying ?? prev.isPlaying,
      roundEnded: p.roundEnded ?? prev.roundEnded,
      sessionId: p.sessionId ?? prev.sessionId,
      rowIndex: p.rowIndex ?? prev.rowIndex,
      tileIndex: p.tileIndex ?? prev.tileIndex,
      cumulativePayoutAmount: p.cumulativePayoutAmount ?? prev.cumulativePayoutAmount,
      diedOnDeathTile: p.diedOnDeathTile ?? prev.diedOnDeathTile,
      initialStake: p.initialStake ?? prev.initialStake,
      totalLoss: p.totalLoss ?? prev.totalLoss,
    }));
  },
}));