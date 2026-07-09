import axios from 'axios';
import { config } from '../config/env';

const paystack = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

export interface PaystackInitResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export const initializePayment = async (
  email: string,
  amount: number,
  reference: string,
  metadata?: any
): Promise<PaystackInitResponse> => {
  const response = await paystack.post('/transaction/initialize', {
    email,
    amount: Math.round(amount * 100),
    reference,
    metadata,
    currency: 'NGN',
    channels: ['card', 'bank', 'ussd', 'mobile_money'],
  });
  return response.data.data;
};

export const verifyPayment = async (reference: string) => {
  const response = await paystack.get(`/transaction/verify/${reference}`);
  return response.data.data;
};

export const chargeAuthorization = async (
  authorizationCode: string,
  email: string,
  amount: number
) => {
  const response = await paystack.post('/transaction/charge_authorization', {
    authorization_code: authorizationCode,
    email,
    amount: Math.round(amount * 100),
    currency: 'NGN',
  });
  return response.data.data;
};

export const createCustomer = async (email: string, firstName: string, lastName: string, phone?: string) => {
  const response = await paystack.post('/customer', {
    email,
    first_name: firstName,
    last_name: lastName,
    phone,
  });
  return response.data.data;
};

export const listBanks = async () => {
  const response = await paystack.get('/bank', { params: { country: 'nigeria' } });
  return response.data.data;
};

export const resolveAccountNumber = async (accountNumber: string, bankCode: string) => {
  const response = await paystack.get('/bank/resolve', {
    params: { account_number: accountNumber, bank_code: bankCode },
  });
  return response.data.data;
};

export const initiateTransfer = async (
  amount: number,
  recipientCode: string,
  reference: string
) => {
  const response = await paystack.post('/transfer', {
    source: 'balance',
    amount: Math.round(amount * 100),
    recipient: recipientCode,
    reference,
  });
  return response.data.data;
};
