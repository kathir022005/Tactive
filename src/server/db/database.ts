import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Database setup
const dbDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.NODE_ENV === 'test' 
  ? ':memory:' 
  : path.resolve(dbDir, 'equipflow.db');

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'STANDARD', -- 'STANDARD', 'VIP', 'ADMIN'
      department TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      serial_number TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'MAINTENANCE', 'RETIRED'
      daily_penalty_rate REAL NOT NULL DEFAULT 50.0,
      description TEXT,
      location TEXT NOT NULL DEFAULT 'Main Office - Locker A',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      start_date TEXT NOT NULL, -- YYYY-MM-DD
      end_date TEXT NOT NULL,   -- YYYY-MM-DD
      status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'CONFIRMED', 'CHECKED_OUT', 'RETURNED', 'REJECTED', 'CANCELLED'
      is_vip_auto_approved INTEGER DEFAULT 0,
      penalty_fee REAL DEFAULT 0.0,
      actual_return_date TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS blackouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      reason TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      user_id INTEGER,
      details TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default data if empty
  seedInitialData();
}

function seedInitialData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (username, password_hash, name, role, department) 
      VALUES (?, ?, ?, ?, ?)
    `);

    // Passwords hashed for simplicity in demo setup (or plain for dev mock)
    insertUser.run('admin', 'admin123', 'System Administrator', 'ADMIN', 'IT Infrastructure');
    insertUser.run('jane_doe', 'user123', 'Jane Doe (VIP Lead)', 'VIP', 'Engineering');
    insertUser.run('john_smith', 'user123', 'John Smith (Dev)', 'STANDARD', 'Software Engineering');
    insertUser.run('alice_wong', 'user123', 'Alice Wong (QA)', 'STANDARD', 'Quality Assurance');
  }

  const assetCount = db.prepare('SELECT COUNT(*) as count FROM assets').get() as { count: number };
  if (assetCount.count === 0) {
    const insertAsset = db.prepare(`
      INSERT INTO assets (name, category, serial_number, status, daily_penalty_rate, description, location)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertAsset.run('MacBook Pro M3 Max 16"', 'Laptop', 'MBP-2024-9901', 'AVAILABLE', 75.0, 'High performance workstation for ML and video rendering', 'Locker A-01');
    insertAsset.run('Sony A7 IV Camera Rig', 'AV Equipment', 'SNY-A7IV-0042', 'AVAILABLE', 60.0, 'Full frame mirrorless camera with 24-70mm f2.8 lens', 'Media Room Studio');
    insertAsset.run('Fluke Industrial Oscilloscope', 'Testing Device', 'FLK-OSC-7712', 'AVAILABLE', 45.0, 'Digital storage oscilloscope for hardware validation', 'Hardware Lab Workbench 3');
    insertAsset.run('DJI Inspire 3 Drone', 'Drone', 'DJI-INS3-8821', 'MAINTENANCE', 100.0, 'Professional aerial filmmaking drone system', 'Storage Unit B-12');
    insertAsset.run('Dell UltraSharp 38" Curved Monitor', 'Peripherals', 'DELL-U38-3310', 'AVAILABLE', 30.0, 'USB-C Hub Monitor for desk setup testing', 'Locker B-04');
  }
}
