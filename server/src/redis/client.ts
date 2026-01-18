import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const createRedisClient = () =>
  createClient({
    url: REDIS_URL,
  });

export const redis = createRedisClient();

redis.on("error", (err) => console.error("Redis Client Error:", err));

await redis.connect();
