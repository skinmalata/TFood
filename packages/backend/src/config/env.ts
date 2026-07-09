import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',

  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '3306', 10),
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'tfood',

  JWT_SECRET: process.env.JWT_SECRET || 'super-secret-key-change-me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  PUSHER_APP_ID: process.env.PUSHER_APP_ID || '',
  PUSHER_KEY: process.env.PUSHER_KEY || '',
  PUSHER_SECRET: process.env.PUSHER_SECRET || '',
  PUSHER_CLUSTER: process.env.PUSHER_CLUSTER || 'eu',

  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY || '',
  PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY || '',

  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',
  TWILIO_API_KEY_SID: process.env.TWILIO_API_KEY_SID || '',
  TWILIO_API_KEY_SECRET: process.env.TWILIO_API_KEY_SECRET || '',
  TWILIO_TWIML_APP_SID: process.env.TWILIO_TWIML_APP_SID || '',

  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || '',

  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
};
