import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Asset } from './models.js';

// override: false → CI-injected env vars win over local .env file
dotenv.config({ override: false });

const MONGO_URI = process.env.MONGO_URI || '';

export async function connectDB(): Promise<void> {
  if (!MONGO_URI) {
    throw new Error('MONGO_URI environment variable is not set.');
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected successfully');
    await seedInitialData();
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
    // In test environments, throw so Vitest can report the error cleanly.
    // In production, exit the process.
    if (process.env.NODE_ENV === 'test') {
      throw err;
    } else {
      process.exit(1);
    }
  }
}

async function seedInitialData(): Promise<void> {
  // Seed users if empty
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    await User.insertMany([
      { username: 'admin',      password_hash: 'admin123', name: 'System Administrator',    role: 'ADMIN',    department: 'IT Infrastructure' },
      { username: 'jane_doe',   password_hash: 'user123',  name: 'Jane Doe (VIP Lead)',     role: 'VIP',      department: 'Engineering' },
      { username: 'john_smith', password_hash: 'user123',  name: 'John Smith (Dev)',        role: 'STANDARD', department: 'Software Engineering' },
      { username: 'alice_wong', password_hash: 'user123',  name: 'Alice Wong (QA)',         role: 'STANDARD', department: 'Quality Assurance' },
    ]);
    console.log('🌱 Seeded default users');
  }

  // Seed assets if empty
  const assetCount = await Asset.countDocuments();
  if (assetCount === 0) {
    await Asset.insertMany([
      { name: 'MacBook Pro M3 Max 16"',       category: 'Laptop',         serial_number: 'MBP-2024-9901',  status: 'AVAILABLE',   daily_penalty_rate: 75,  description: 'High performance workstation for ML and video rendering',         location: 'Locker A-01' },
      { name: 'Sony A7 IV Camera Rig',         category: 'AV Equipment',   serial_number: 'SNY-A7IV-0042',  status: 'AVAILABLE',   daily_penalty_rate: 60,  description: 'Full frame mirrorless camera with 24-70mm f2.8 lens',             location: 'Media Room Studio' },
      { name: 'Fluke Industrial Oscilloscope', category: 'Testing Device', serial_number: 'FLK-OSC-7712',   status: 'AVAILABLE',   daily_penalty_rate: 45,  description: 'Digital storage oscilloscope for hardware validation',            location: 'Hardware Lab Workbench 3' },
      { name: 'DJI Inspire 3 Drone',           category: 'Drone',          serial_number: 'DJI-INS3-8821',  status: 'MAINTENANCE', daily_penalty_rate: 100, description: 'Professional aerial filmmaking drone system',                    location: 'Storage Unit B-12' },
      { name: 'Dell UltraSharp 38" Curved Monitor', category: 'Peripherals', serial_number: 'DELL-U38-3310', status: 'AVAILABLE', daily_penalty_rate: 30,  description: 'USB-C Hub Monitor for desk setup testing',                       location: 'Locker B-04' },
    ]);
    console.log('🌱 Seeded default assets');
  }
}

export default connectDB;
