import mongoose from 'mongoose';

import { config } from './config.js';
import { createApp } from './app.js';

async function main() {
  await mongoose.connect(config.MONGODB_URI);
  console.log('Connected to MongoDB');

  const server = createApp().listen(config.PORT, () => {
    console.log(`Server listening on http://localhost:${config.PORT}`);
  });

  const shutdown = async () => {
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
