import { createClient } from 'redis';
import { REDIS_URL } from '../config';

const redisClient = createClient({ url: REDIS_URL });

redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

export async function getRedisClient() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  return redisClient;
}
