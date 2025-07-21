import dotenv from 'dotenv';
dotenv.config();

export const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
export const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
export const PORT = process.env.PORT || 3000;
export const PRODUCT_BULK_QUEUE = process.env.PRODUCT_BULK_QUEUE || 'product_bulk';
