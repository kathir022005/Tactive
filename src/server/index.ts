import 'dotenv/config';
import { createApp } from './app.js';
import { connectDB } from './db/database.js';

const PORT = process.env.PORT || 3000;

async function main() {
  await connectDB();        // Connect to MongoDB Atlas first
  const app = createApp(); // Then create Express app
  app.listen(PORT, () => {
    console.log(`🚀 EquipFlow Server running on http://localhost:${PORT}`);
    console.log(`📦 Database: MongoDB Atlas`);
  });
}

main().catch(err => {
  console.error('❌ Server startup failed:', err);
  process.exit(1);
});
