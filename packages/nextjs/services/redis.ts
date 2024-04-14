import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_URL as string,
  token: process.env.UPSTASH_TOKEN as string,
});

// await redis.hset(TX_COLLECTION_NAME, {
//   [address]: { ...newDevice, address, publicKey: authResponse.response.publicKey, user },
// });
//     const currentUser: any = isLocal ? UserData[address] : await redis.hget(TX_COLLECTION_NAME, address);
