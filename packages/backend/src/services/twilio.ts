import { config } from '../config/env';

let twilioClient: any = null;

if (config.TWILIO_ACCOUNT_SID && config.TWILIO_AUTH_TOKEN) {
  twilioClient = require('twilio')(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
}

export const initiateCall = async (to: string, from?: string): Promise<any> => {
  if (!twilioClient) {
    throw new Error('Twilio not configured. Set TWILIO_* environment variables.');
  }
  const call = await twilioClient.calls.create({
    url: 'https://handler.twilio.com/twiml/EH...', // Your TwiML bin URL
    to,
    from: from || config.TWILIO_PHONE_NUMBER,
  });
  return { callSid: call.sid, status: call.status };
};

export const sendSMS = async (to: string, message: string): Promise<void> => {
  if (!twilioClient) {
    throw new Error('Twilio not configured. Set TWILIO_* environment variables.');
  }
  await twilioClient.messages.create({
    body: message,
    to,
    from: config.TWILIO_PHONE_NUMBER,
  });
};

export const generateVoiceToken = (identity: string, roomName: string): string => {
  // For in-app voice, use Twilio AccessToken
  const AccessToken = require('twilio').jwt.AccessToken;
  const VoiceGrant = AccessToken.VoiceGrant;

  const accessToken = new AccessToken(
    config.TWILIO_ACCOUNT_SID,
    config.TWILIO_API_KEY_SID || config.TWILIO_ACCOUNT_SID,
    config.TWILIO_API_KEY_SECRET || config.TWILIO_AUTH_TOKEN,
    { identity }
  );

  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: config.TWILIO_TWIML_APP_SID,
    incomingAllow: true,
  });

  accessToken.addGrant(voiceGrant);
  return accessToken.toJwt();
};
