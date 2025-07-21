import { Request, Response } from 'express';
import { getRedisClient } from '../services/redis.service';

export const productBulkStatusHandler = async (req: Request, res: Response) => {
  try {
    const { bulkRequestId } = req.params;
    if (!bulkRequestId) {
      return res.status(400).json({ error: 'Missing bulkRequestId in params' });
    }
    const redis = await getRedisClient();
    const hashKey = `bulk:${bulkRequestId}`;
    const allOps = await redis.hGetAll(hashKey);

    let completed = 0,
      failed = 0,
      in_progress = 0;
    Object.values(allOps).forEach((status) => {
      switch (status) {
        case 'completed':
          completed++;
          break;
        case 'failed':
          failed++;
          break;
        case 'in_progress':
          in_progress++;
          break;
      }
    });

    return res.json({ completed, failed, in_progress });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
