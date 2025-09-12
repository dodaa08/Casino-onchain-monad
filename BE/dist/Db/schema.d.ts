import { Schema } from "mongoose";
export declare const User: import("mongoose").Model<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    walletAddress: string;
    balance: number;
    totalEarned: number;
    roundsPlayed: number;
    payouts: import("mongoose").Types.DocumentArray<{
        status: "pending" | "success" | "failed";
        createdAt: NativeDate;
        amount?: number | null;
        txHash?: string | null;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        status: "pending" | "success" | "failed";
        createdAt: NativeDate;
        amount?: number | null;
        txHash?: string | null;
    }> & {
        status: "pending" | "success" | "failed";
        createdAt: NativeDate;
        amount?: number | null;
        txHash?: string | null;
    }>;
}, {}, {}, {}, import("mongoose").Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    walletAddress: string;
    balance: number;
    totalEarned: number;
    roundsPlayed: number;
    payouts: import("mongoose").Types.DocumentArray<{
        status: "pending" | "success" | "failed";
        createdAt: NativeDate;
        amount?: number | null;
        txHash?: string | null;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        status: "pending" | "success" | "failed";
        createdAt: NativeDate;
        amount?: number | null;
        txHash?: string | null;
    }> & {
        status: "pending" | "success" | "failed";
        createdAt: NativeDate;
        amount?: number | null;
        txHash?: string | null;
    }>;
}, {}, {
    timestamps: true;
}> & {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    walletAddress: string;
    balance: number;
    totalEarned: number;
    roundsPlayed: number;
    payouts: import("mongoose").Types.DocumentArray<{
        status: "pending" | "success" | "failed";
        createdAt: NativeDate;
        amount?: number | null;
        txHash?: string | null;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        status: "pending" | "success" | "failed";
        createdAt: NativeDate;
        amount?: number | null;
        txHash?: string | null;
    }> & {
        status: "pending" | "success" | "failed";
        createdAt: NativeDate;
        amount?: number | null;
        txHash?: string | null;
    }>;
} & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, Schema<any, import("mongoose").Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    walletAddress: string;
    balance: number;
    totalEarned: number;
    roundsPlayed: number;
    payouts: import("mongoose").Types.DocumentArray<{
        status: "pending" | "success" | "failed";
        createdAt: NativeDate;
        amount?: number | null;
        txHash?: string | null;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        status: "pending" | "success" | "failed";
        createdAt: NativeDate;
        amount?: number | null;
        txHash?: string | null;
    }> & {
        status: "pending" | "success" | "failed";
        createdAt: NativeDate;
        amount?: number | null;
        txHash?: string | null;
    }>;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    walletAddress: string;
    balance: number;
    totalEarned: number;
    roundsPlayed: number;
    payouts: import("mongoose").Types.DocumentArray<{
        status: "pending" | "success" | "failed";
        createdAt: NativeDate;
        amount?: number | null;
        txHash?: string | null;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        status: "pending" | "success" | "failed";
        createdAt: NativeDate;
        amount?: number | null;
        txHash?: string | null;
    }> & {
        status: "pending" | "success" | "failed";
        createdAt: NativeDate;
        amount?: number | null;
        txHash?: string | null;
    }>;
}>, {}, import("mongoose").ResolveSchemaOptions<{
    timestamps: true;
}>> & import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    walletAddress: string;
    balance: number;
    totalEarned: number;
    roundsPlayed: number;
    payouts: import("mongoose").Types.DocumentArray<{
        status: "pending" | "success" | "failed";
        createdAt: NativeDate;
        amount?: number | null;
        txHash?: string | null;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        status: "pending" | "success" | "failed";
        createdAt: NativeDate;
        amount?: number | null;
        txHash?: string | null;
    }> & {
        status: "pending" | "success" | "failed";
        createdAt: NativeDate;
        amount?: number | null;
        txHash?: string | null;
    }>;
}> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const Game: import("mongoose").Model<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    status: "active" | "cashed_out" | "lost";
    player: import("mongoose").Types.ObjectId;
    finalPayout: number;
    roundsCompleted: number;
    startedAt: NativeDate;
    endedAt?: NativeDate | null;
}, {}, {}, {}, import("mongoose").Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    status: "active" | "cashed_out" | "lost";
    player: import("mongoose").Types.ObjectId;
    finalPayout: number;
    roundsCompleted: number;
    startedAt: NativeDate;
    endedAt?: NativeDate | null;
}, {}, {
    timestamps: true;
}> & {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    status: "active" | "cashed_out" | "lost";
    player: import("mongoose").Types.ObjectId;
    finalPayout: number;
    roundsCompleted: number;
    startedAt: NativeDate;
    endedAt?: NativeDate | null;
} & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, Schema<any, import("mongoose").Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    status: "active" | "cashed_out" | "lost";
    player: import("mongoose").Types.ObjectId;
    finalPayout: number;
    roundsCompleted: number;
    startedAt: NativeDate;
    endedAt?: NativeDate | null;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    status: "active" | "cashed_out" | "lost";
    player: import("mongoose").Types.ObjectId;
    finalPayout: number;
    roundsCompleted: number;
    startedAt: NativeDate;
    endedAt?: NativeDate | null;
}>, {}, import("mongoose").ResolveSchemaOptions<{
    timestamps: true;
}>> & import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    status: "active" | "cashed_out" | "lost";
    player: import("mongoose").Types.ObjectId;
    finalPayout: number;
    roundsCompleted: number;
    startedAt: NativeDate;
    endedAt?: NativeDate | null;
}> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>>;
//# sourceMappingURL=schema.d.ts.map