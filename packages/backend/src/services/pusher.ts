import Pusher from 'pusher';
import { config } from '../config/env';

let pusher: Pusher | null = null;

if (config.PUSHER_APP_ID && config.PUSHER_KEY && config.PUSHER_SECRET) {
  pusher = new Pusher({
    appId: config.PUSHER_APP_ID,
    key: config.PUSHER_KEY,
    secret: config.PUSHER_SECRET,
    cluster: config.PUSHER_CLUSTER,
    useTLS: true,
  });
}

export const getPusher = (): Pusher => {
  if (!pusher) {
    throw new Error('Pusher not configured. Set PUSHER_* environment variables.');
  }
  return pusher;
};

export const triggerOrderEvent = async (vendorId: number, event: string, data: any) => {
  const p = getPusher();
  await p.trigger(`vendor-${vendorId}`, event, data);
};

export const triggerConsumerEvent = async (consumerId: number, event: string, data: any) => {
  const p = getPusher();
  await p.trigger(`consumer-${consumerId}`, event, data);
};

export const triggerChatEvent = async (orderId: number, event: string, data: any) => {
  const p = getPusher();
  await p.trigger(`chat-${orderId}`, event, data);
};

export const triggerAdminEvent = async (event: string, data: any) => {
  const p = getPusher();
  await p.trigger('admin-channel', event, data);
};
