const base = (process.env.NEXT_PUBLIC_BE_URL as string) || "http://localhost:8001";

console.log("[API] base", base);

type CacheTilePayload = {
  sessionId: string | number;
  rowIndex: number;
  tileIndex: number;
  isDeath: boolean;
  roundEnded: boolean;
  walletAddress: string;
};

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