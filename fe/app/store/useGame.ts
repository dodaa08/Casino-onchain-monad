import { create } from "zustand";
import { cacheTile } from "@/app/services/api";
// import cacheTile from "@/app/services/api";

type GameState = {
  isPlaying: boolean;
  roundEnded: boolean;
  diedOnDeathTile: boolean; // Track if round ended due to death tile
  sessionId: string;
  rowIndex: number;
  tileIndex: number;
  setSessionId: (id: string) => void;
  Replay: boolean;
  start: () => void;
  endRound: () => void;
  setReplay: (replay: boolean) => void;
  // rowMultiplier is optional for backward compatibility; stakeOverride optional if you want to pass stake per click
  selectTile: (row: number, tile: number, walletAddress: string, isDeath: boolean, rowMultiplier?: number, stakeOverride?: number) => Promise<void>;
  rehydrate: (p: Partial<Pick<GameState, "isPlaying" | "roundEnded" | "sessionId" | "rowIndex" | "tileIndex" | "cumulativePayoutAmount">>) => void;
  setCumulativePayoutAmount: (amount: number) => void;
  payoutAmount : number; // ETH you would cash out now
  cumulativePayoutAmount: number; // Death Points (risked ETH * 150)
  stake: number;
  cumulativeMultiplier: number;
  setStake: (s: number)=> void;
};

export const useGame = create<GameState>((set, get) => ({
  isPlaying: false,
  roundEnded: false,
  diedOnDeathTile: false,
  sessionId: "",
  rowIndex: 0,
  tileIndex: 0,
  payoutAmount: 0,
  cumulativePayoutAmount: 0,
  stake: 1,
  cumulativeMultiplier: 1,
  Replay: false,
  setReplay: (replay) => set({ Replay: replay }),

  setStake: (s) => set({ stake: s }),
  setSessionId: (id) => set({ sessionId: id }),
  setCumulativePayoutAmount: (amount) => set({ cumulativePayoutAmount: amount }),
  start: () => set({ isPlaying: true, roundEnded: false, diedOnDeathTile: false, payoutAmount: 0, cumulativePayoutAmount: 0, cumulativeMultiplier: 1 }),
  endRound: () => set({ isPlaying: false, roundEnded: true }),

  selectTile: async (rowIndex, tileIndex, walletAddress, isDeath, rowMultiplier, stakeOverride) => {
    set({ rowIndex, tileIndex });
    const { sessionId, stake } = get();
    // fire-and-forget; handle errors as you like
    try {
      await cacheTile({
        sessionId,
        rowIndex,
        tileIndex,
        isDeath,
        roundEnded: isDeath,         // true when death
        walletAddress,
      });
      console.log("cacheTile", { sessionId, rowIndex, tileIndex, isDeath, roundEnded: isDeath, walletAddress });

      if (isDeath) {
        // On death, end round; keep last computed points, zero ETH payout
        set({ isPlaying: false, roundEnded: true, diedOnDeathTile: true, payoutAmount: 0 });
        return;
      }

      // Safe click: update ETH payout and Death Points
      if (typeof rowMultiplier === "number") {
        const effectiveStake = typeof stakeOverride === "number" ? stakeOverride : stake;
        const newCumulativeMultiplier = rowMultiplier; // rows[] multiplier is cumulative per row
        const ethNow = Number((effectiveStake * newCumulativeMultiplier).toFixed(4));
        const deathPoints = Number((ethNow * 150).toFixed(2));
        console.log("[PAYOUT] riskedETH", ethNow, "deathPoints", deathPoints, "mult", newCumulativeMultiplier);
        set({
          cumulativeMultiplier: newCumulativeMultiplier,
          payoutAmount: ethNow,
          cumulativePayoutAmount: deathPoints,
        });
      }
    } catch (e) {
      // optional: toast/log
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
    }));
  },
}));