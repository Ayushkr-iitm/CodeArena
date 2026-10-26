import Redis from "ioredis";

const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379", 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

export const redisConfig = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
  connectTimeout: 2000,
  retryStrategy(times: number) {
    if (times > 3) {
      return null; // Stop retrying after 3 attempts if Redis is not running
    }
    return Math.min(times * 200, 1000);
  },
};

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(redisConfig);
    redisClient.on("error", (err) => {
      // Avoid spamming unhandled error logs when Redis is not available
      if (process.env.NODE_ENV === "development") {
        // quiet debug log
      }
    });
  }
  return redisClient;
}

/**
 * Checks if Redis is accessible with a fast ping probe.
 */
export async function isRedisAvailable(): Promise<boolean> {
  const probe = new Redis({
    ...redisConfig,
    lazyConnect: true,
  });

  try {
    await probe.connect();
    const res = await probe.ping();
    await probe.quit();
    return res === "PONG";
  } catch {
    try {
      probe.disconnect();
    } catch {}
    return false;
  }
}
