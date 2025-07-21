import amqp from 'amqplib';
import { RABBITMQ_URL } from '../config';

let rabbitConnection: amqp.ChannelModel | null = null;

async function getConnection(): Promise<amqp.ChannelModel> {
  if (!rabbitConnection) {
    const connection = await amqp.connect(RABBITMQ_URL);
    connection.on('error', (err) => {
      console.error('RabbitMQ connection error', err);
      rabbitConnection = null;
    });
    rabbitConnection = connection;
  }
  return rabbitConnection;
}

export async function createChannel(confirm = false) {
  const connection = await getConnection();
  return confirm ? await connection.createConfirmChannel() : await connection.createChannel();
}
