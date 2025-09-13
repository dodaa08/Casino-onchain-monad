import {Schema, model} from "mongoose";


const userSchema = new Schema(
    {
      walletAddress: { type: String, required: true, unique: true }, // identity
      DepositBalance: { type: Number, default: 0 }, // current on-platform balance (after deposits/cashouts)
      balance: { type: Number, default: 0 }, // current on-platform balance (after deposits/cashouts)
      totalEarned: { type: Number, default: 0 }, // lifetime earnings
      roundsPlayed: { type: Number, default: 0 }, // total sessions
      payouts: { type: Number, default: 0 }, // last payout amount
    },
    { timestamps: true }
  );
  
  export const User = model("User", userSchema);


  

  const gameSchema = new Schema(
    {
      player: { type: Schema.Types.ObjectId, ref: "User", required: true },
      status: { type: String, enum: ["active", "cashed_out", "lost"], default: "active" },
      finalPayout: { type: Number, default: 0 }, // only stored when game ends
      roundsCompleted: { type: Number, default: 0 },
      startedAt: { type: Date, default: Date.now },
      endedAt: { type: Date },
    },
    { timestamps: true }
  );


  const payoutSchema = new Schema(
    {
      user: { type: Schema.Types.ObjectId, ref: "User", required: true },
      amount: { type: Number, required: true },
      txHash: { type: String, required: true },
    },
    { timestamps: true }
  );

  export const Payout = model("Payout", payoutSchema);
  
  export const Game = model("Game", gameSchema);