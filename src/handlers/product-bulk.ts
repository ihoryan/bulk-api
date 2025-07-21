import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createChannel } from '../services/rabbitmq.service';
import { getRedisClient } from '../services/redis.service';
import { JobStatus, Operation } from '../types';
import { PRODUCT_BULK_QUEUE } from '../config';

export const productBulkHandler = async (
  req: Request<any, any, { operations: Operation[] }>,
  res: Response,
) => {
  try {
    const { operations } = req.body;
    const bulkRequestId = uuidv4();
    const jobs = operations.map((op) => ({
      bulkRequestId,
      ...op,
    }));
    const bulkKey = `bulk:${bulkRequestId}`;

    const hashOps: [string, JobStatus][] = jobs.map((op) => [`ops:${op.id}`, 'in_progress']);

    const channel = await createChannel(true);
    const redis = await getRedisClient();

    for (const [field, value] of hashOps) {
      await redis.hSet(bulkKey, field, value);
    }

    for (const job of jobs) {
      await new Promise<void>((resolve, reject) => {
        channel.sendToQueue(
          PRODUCT_BULK_QUEUE,
          Buffer.from(JSON.stringify(job)),
          { persistent: true },
          (err) => {
            if (err) {
              reject(err);
            }
            resolve();
          },
        );
      });
    }

    res.status(202).json({
      bulkRequestId,
      statusUrl: `/product/bulk/status/${bulkRequestId}`,
      message: 'Bulk request accepted for processing.',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
