import axios from "axios";

const base = (process.env.NEXT_PUBLIC_BE_URL as string) || "http://localhost:8001";


type CacheTilePayload = {
  sessionId: string | number;
  rowIndex: number | string;
  tileIndex: number | string;
  isDeath: boolean;
  roundEnded: boolean;
  walletAddress: string;
};

type CreateUserPayload = {
  walletAddress: string;
  balance: number;
};


type SessionPayload = {
  isDeath: boolean;
  roundEnded: boolean;
  walletAddress: string;
  sessionId: string;
  // roundNumber: number;
  rowIndex: number;
  tileIndex: number;
  // multiplier: number;
}

// Create Cache tile 

export async function cacheTile(p: CacheTilePayload) {
  const res = await fetch(`${base}/api/cache/cache-tiles`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("[API] cache-tiles failed", res.status, data);
    throw new Error(`cacheTile failed: ${res.status}`);
  }
  
  return data;
}


export async function cachePayout(p: { key: string; value: number; roundEnded: boolean }) {
  const res = await fetch(`${base}/api/cache/cache-payout`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p),
  });
  if (!res.ok) throw new Error(`cachePayout failed: ${res.status}`);
  return res.json();
}


// Create User
export async function createUser(payload: CreateUserPayload) {
  const res = await fetch(`${base}/api/users/create-user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress: payload.walletAddress, balance: payload.balance }),
  });

  const data = await res.json().catch(() => ({}));

  // Treat “already exists” as non-fatal
  if (res.status === 400 && data?.message === "User already exists") {
    return { success: true, exists: true };
  }

  if (!res.ok) {
    console.error("[API] createUser failed", res.status, data);
    throw new Error(`createUser failed: ${res.status}`);
  }

  return data;
}

// Get User
export async function getUser(walletAddress : string){
  const res = await fetch(`${base}/api/users/get-user/${walletAddress}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
  });
  const data = await res.json();
  return data;
}


// get last session id
export async function getLastSessionId(walletAddress : string){
  const res = await fetch(`${base}/api/cache/get-last-sessionId/${walletAddress}`, {
    method: "GET", headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`getLastSessionId failed: ${res.status}`);
  const data = await res.json();
  return data;
}


// get session state (simplified)
export const getSessionState = async (sessionId: string) => {
  const ts = Date.now();
  const url = `${base}/api/cache/check-cache/${sessionId}?t=${ts}`;
  const res = await fetch(url, { method:"GET", headers:{ "Content-Type":"application/json" }, cache:"no-store" });
  return res.json();
};


// cache the incresing payouts 
export const cachePayouts = async (p: { key: string; value: number; roundEnded: boolean, walletAddress: string })=>{
  if(!p.walletAddress) throw new Error(`walletAddress is required`);
  const res = await fetch(`${base}/api/cache/cache-payout`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p),
  });
  if (!res.ok) throw new Error(`cachePayouts failed: ${res.status}`); 
  const data = await res.json();
  return data;
}


// get cached payouts
export const getCachedPayouts = async (walletAddress: string)=>{
  const res = await fetch(`${base}/api/cache/check-payout/${walletAddress}`, {
    method: "GET", headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`getCachedPayouts failed: ${res.status}`);
  return res.json();
};

// clear cache for replay
export const clearCache = async (walletAddress: string)=>{
  const res = await fetch(`${base}/api/cache/clear-cache`, {
    method: "POST", 
    headers: { "Content-Type": "application/json" }, 
    body: JSON.stringify({ walletAddress }),
  });
  if (!res.ok) throw new Error(`clearCache failed: ${res.status}`); 
  const data = await res.json();
  return data;
};



// Connect wallet for referral

export const ConnectWallet = async (walletAddress: string, referrer: string)=>{
  try{
    const res = await axios.post(`${process.env.NEXT_PUBLIC_BE_URL}/api/users/wallet-connect`, {
      walletAddress: walletAddress,
      referrer: referrer
    });
    return res;
  } catch(error){
    console.error("ConnectWallet error:", error);
    throw error;
  }

}


// get referred user
export const getReferredUser = async (walletAddress: string)=>{
  const res = await fetch(`${base}/api/users/get-referred-user`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ walletAddress }),
  });
  return res.json();
}



// get Total Earnings
export const getTotalEarnings = async (walletAddress: string)=>{
  const res = await fetch(`${base}/api/leaderboard/get-total-earnings`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ walletAddress }),
  });
  return res.json();
}


// sessions start
export const StartSession = async (walletAddress: string, clientSeed: string, numRows: number)=>{
  const res = await fetch(`${base}/api/sessions/start`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ walletAddress, clientSeed, numRows }),
  });
  return res.json();
}

// sessions reveal
export const RevealSession = async (sessionId: string) => {
  const res = await fetch(`${base}/api/sessions/${sessionId}/reveal`, {
    method: "POST", 
    headers: { "Content-Type": "application/json" }
  });
  return res.json();
};

export const GetProof = async (sessionId: string) => {
  const res = await fetch(`${base}/api/sessions/${sessionId}/proof`, {
    method: "GET", 
    headers: { "Content-Type": "application/json" }
  });
  return res.json();
};

export const RestoreSession = async (sessionId: string) => {
  const res = await fetch(`${base}/api/sessions/${sessionId}/restore`, {
    method: "GET", 
    headers: { "Content-Type": "application/json" }
  });
  return res.json();
};