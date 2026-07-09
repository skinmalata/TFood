import Pusher from '@pusher/pusher-websocket-react-native';
import { PUSHER_KEY, PUSHER_CLUSTER } from '../constants/config';

let pusher: Pusher | null = null;

export const initPusher = async (userId: number) => {
  pusher = Pusher.getInstance();
  await pusher.init({
    apiKey: PUSHER_KEY,
    cluster: PUSHER_CLUSTER,
    onConnectionStateChange: (state) => console.log('Pusher state:', state),
    onError: (err) => console.error('Pusher error:', err),
  });

  await pusher.connect();

  // Subscribe to consumer channel
  const channel = `consumer-${userId}`;
  await pusher.subscribe({ channelName: channel, onEvent: (event) => {
    console.log('Pusher event:', event.eventName, event.data);
  }});

  return pusher;
};

export const subscribeToOrder = (orderId: number, callback: (data: any) => void) => {
  if (!pusher) return;
  const channel = `chat-${orderId}`;
  pusher.subscribe({
    channelName: channel,
    onEvent: (event) => {
      if (event.eventName === 'new-message') {
        callback(JSON.parse(event.data));
      }
    },
  });
};

export const disconnectPusher = async () => {
  if (pusher) {
    await pusher.disconnect();
    pusher = null;
  }
};
