import app from './app';
import { config } from './config/env';

const start = async () => {
  try {
    app.listen(config.PORT, () => {
      console.log(`\n🚀 TFood API server running on port ${config.PORT}`);
      console.log(`📡 Environment: ${config.NODE_ENV}`);
      console.log(`🔗 http://localhost:${config.PORT}/api/health\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
