// src/shared/redis.ts
import { createClient } from "redis";

const redis = createClient({
  url: process.env.REDIS_URL || "redis://localhost:5043",
  RESP: 2, // Forces the client to use RESP2 protocol without sending 'HELLO 3'
});

redis.on("error", (err) => {
  console.error("Redis Error:", err);
});

export default redis;
