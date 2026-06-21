import { Redis } from "@upstash/redis";

let client: Redis | null = null;

/** Lazy Upstash Redis client. Throws only when used without env (so build stays clean). */
export function getRedis(): Redis {
  if (!client) {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    if (!url || !token) {
      throw new Error("Upstash Redis env missing (KV_REST_API_URL / KV_REST_API_TOKEN)");
    }
    client = new Redis({ url, token });
  }
  return client;
}
