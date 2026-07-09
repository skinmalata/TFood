# Deploying TFood on cPanel

## 1. Backend API (Node.js)

Most modern cPanel hosts support Node.js via **AppManager** or **Setup Node.js App**:

1. **Upload files**: Upload `packages/backend/` contents to a subdomain folder (e.g., `api.tfood.ng/`)
2. **Install dependencies**: Run `npm install --production`
3. **Configure environment**: Create `.env` from `.env.example` with your production DB credentials
4. **Setup Database**: 
   - Create MySQL database in cPanel's MySQL Database Wizard
   - Import the schema: `npx knex migrate:latest --knexfile src/config/knexfile.ts`
   - Seed data: `npx knex seed:run --knexfile src/config/knexfile.ts`
5. **Setup Node.js app**:
   - In cPanel, find "Setup Node.js App"
   - Choose the folder
   - Set entry point: `dist/index.js`
   - Set environment variables
   - Start the app

### For Node.js persistence (avoiding cPanel Node app issues):
```bash
# Install PM2 globally
npm install -g pm2

# Start the API
pm2 start dist/index.js --name tfood-api

# Save PM2 process list
pm2 save

# Setup PM2 to restart on reboot
pm2 startup
```

## 2. Admin Dashboard (React)

1. Build: `npm run build -w packages/admin-web` (produces `dist/`)
2. Upload `dist/` contents to your admin subdomain (e.g., `admin.tfood.ng/`)
3. Set the API URL in production by configuring the proxy or updating the axios base URL

## 3. Mobile Apps

Build with Expo/EAS:
```bash
cd packages/consumer-app
npx eas build --platform android
npx eas build --platform ios

cd packages/vendor-app
npx eas build --platform android
npx eas build --platform ios
```

## 4. Database Setup

```sql
CREATE DATABASE tfood;
CREATE USER 'tfood_user'@'localhost' IDENTIFIED BY 'your-strong-password';
GRANT ALL PRIVILEGES ON tfood.* TO 'tfood_user'@'localhost';
FLUSH PRIVILEGES;
```

Then run migrations:
```bash
cd packages/backend
cp .env.example .env
# Edit .env with your DB credentials
npx knex migrate:latest
npx knex seed:run
```

## 5. Required External Services

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| **Pusher** | Real-time orders, chat | 200k messages/day free |
| **Paystack** | Payment processing | Pay-per-transaction |
| **Twilio** | Voice calls | $15 trial credit |
| **Google Maps** | Distance calc, map display | $200/month free credit |
