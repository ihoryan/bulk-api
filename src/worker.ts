import { getRedisClient } from './services/redis.service';
import { createChannel } from './services/rabbitmq.service';
import { PRODUCT_BULK_QUEUE } from './config';
import { Job, JobStatus } from './types';
import { ConsumeMessage } from 'amqplib';

async function processJob(job: Job): Promise<JobStatus> {
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000));
  const rand = Math.random();
  if (rand > 0.9) {
    throw new Error('Test error');
  }
  if (rand < 0.8) {
    return 'completed';
  } else {
    return 'failed';
  }
}

async function startWorker() {
  const redisClient = await getRedisClient();
  const channel = await createChannel();

  const DLQ = `${PRODUCT_BULK_QUEUE}.dlq`;
  await channel.assertQueue(DLQ, { durable: true });

  await channel.assertQueue(PRODUCT_BULK_QUEUE, {
    durable: true,
    deadLetterExchange: '',
    deadLetterRoutingKey: DLQ,
  });

  await channel.consume(
    PRODUCT_BULK_QUEUE,
    async (msg) => {
      try {
        if (!msg) return;

        const job = JSON.parse(msg.content.toString());
        const { bulkRequestId, id: operationId } = job;
        const bulkKey = `bulk:${bulkRequestId}`;
        const opField = `ops:${operationId}`;
        const lockKey = `lock:${bulkRequestId}:${operationId}`;
        const LOCK_TTL = 30;

        const lockAcquired = await redisClient.set(lockKey, 'locked', { NX: true, EX: LOCK_TTL });
        if (!lockAcquired) {
          channel.ack(msg);
          return;
        }

        try {
          const result = await processJob(job);
          await redisClient.hSet(bulkKey, opField, result);
          channel.ack(msg);
        } catch (err) {
          console.log(`Job ${operationId} failed, moved to DLQ`, err);
          channel.nack(msg as ConsumeMessage, false, false);
        }
      } catch (err) {
        console.log(`Job failed, requeued`);
        channel.nack(msg as ConsumeMessage, false, true);
      }
    },
    { noAck: false },
  );
  console.log('Waiting for job');
}

startWorker().catch(console.error);
