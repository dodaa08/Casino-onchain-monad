const base = (process.env.NEXT_PUBLIC_BE_URL as string) || "http://localhost:8001";
console.log("[API] base", base);


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
  console.log("[API] cache-tiles ->", p);
  const res = await fetch(`${base}/api/cache/cache-tiles`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("[API] cache-tiles failed", res.status, data);
    throw new Error(`cacheTile failed: ${res.status}`);
  }
  
  console.log("[API] cache-tiles ok", data);
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
  console.log("[API] getLastSessionId ok", res.status);
  const data = await res.json();
  return data;
}


// get session state (simplified)
export const getSessionState = async (sessionId: string) => {
  const ts = Date.now();
  const url = `${base}/api/cache/check-cache/${sessionId}?t=${ts}`;
  console.log("[rehydrate] GET", url);
  const res = await fetch(url, { method:"GET", headers:{ "Content-Type":"application/json" }, cache:"no-store" });
  console.log("[rehydrate] res", res);
  return res.json();
};


// cache the incresing payouts 
export const cachePayouts = async (p: { key: string; value: number; roundEnded: boolean, walletAddress: string })=>{
  console.log("[API] cachePayouts ->", p);
  if(!p.walletAddress) throw new Error(`walletAddress is required`);
  const res = await fetch(`${base}/api/cache/cache-payout`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p),
  });
  if (!res.ok) throw new Error(`cachePayouts failed: ${res.status}`); 
  const data = await res.json();
  console.log("[API] cachePayouts ok", res.status);
  return data;
}


// get cached payouts
export const getCachedPayouts = async (walletAddress: string)=>{
  const res = await fetch(`${base}/api/cache/check-payout/${walletAddress}`, {
    method: "GET", headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`getCachedPayouts failed: ${res.status}`);
  console.log("[API] getCachedPayouts ok", res.status);
  return res.json();
}