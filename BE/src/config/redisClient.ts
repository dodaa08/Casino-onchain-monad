import { createClient } from "redis";

const client = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

client.on("error", (err) => console.error("❌ Redis Client Error", err));
client.on("connect", () => console.log("✅ Connected to Redis"));

client.connect().catch(console.error);

export default client;
