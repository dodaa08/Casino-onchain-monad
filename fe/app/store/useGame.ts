import { create } from "zustand";
import { cacheTile } from "@/app/services/api";
// import cacheTile from "@/app/services/api";



type GameState = {
  isPlaying: boolean;
  roundEnded: boolean;
  sessionId: string;
  rowIndex: number;
  tileIndex: number;
  setSessionId: (id: string) => void;
  start: () => void;
  endRound: () => void;
  selectTile: (row: number, tile: number, walletAddress: string, isDeath: boolean) => Promise<void>;
};

export const useGame = create<GameState>((set, get) => ({
  isPlaying: false,
  roundEnded: false,
  sessionId: "",
  rowIndex: 0,
  tileIndex: 0,

  setSessionId: (id) => set({ sessionId: id }),
  start: () => set({ isPlaying: true, roundEnded: false }),
  endRound: () => set({ isPlaying: false, roundEnded: true }),

  selectTile: async (rowIndex, tileIndex, walletAddress, isDeath) => {
    set({ rowIndex, tileIndex });
    const { sessionId } = get();
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
      if (isDeath) set({ isPlaying: false, roundEnded: true });
    } catch (e) {
      // optional: toast/log
      console.error(e);
      console.error("[CACHE] tile cache failed", e);
    }
  },
}));