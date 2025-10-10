import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const client = createClient({
  url: redisUrl,
});

let isConnected = false;

client.on("error", (err) => {
  console.error("❌ Redis Client Error", err.message);
  isConnected = false;
});

client.on("connect", () => {
  console.log("✅ Connected to Redis");
  isConnected = true;
});

// Try to connect but don't crash the app if it fails
if (redisUrl) {
  client.connect().catch((err) => {
    console.error("⚠️  Redis connection failed, running without cache:", err.message);
    isConnected = false;
  });
} else {
  console.log("⚠️  Redis disabled - REDIS_URL not configured");
}

export default client;
export { isConnected };
