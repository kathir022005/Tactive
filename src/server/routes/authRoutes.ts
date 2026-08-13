import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/database.js';
import { JWT_SECRET, authenticateToken } from '../middleware/auth.js';
import { validateBody, loginSchema } from '../middleware/validation.js';

export const authRouter = Router();

authRouter.post('/login', validateBody(loginSchema), (req: Request, res: Response) => {
  const { username, password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;

  if (!user || user.password_hash !== password) {
    return res.status(401).json({ error: 'Invalid username or password credentials.' });
  }

  const tokenPayload = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    department: user.department
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

  return res.json({
    message: 'Login successful',
    token,
    user: tokenPayload
  });
});

// ── Register new account ──
authRouter.post('/register', (req: Request, res: Response) => {
  const { username, name, department, password } = req.body;

  if (!username || !name || !department || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(409).json({ error: 'Username already taken. Please choose another.' });
  }

  const result = db.prepare(
    'INSERT INTO users (username, password_hash, name, role, department) VALUES (?, ?, ?, ?, ?)'
  ).run(username, password, name, 'STANDARD', department);

  const newUser = {
    id: result.lastInsertRowid as number,
    username,
    name,
    role: 'STANDARD',
    department
  };

  const token = jwt.sign(newUser, JWT_SECRET, { expiresIn: '24h' });
  return res.status(201).json({ message: 'Account created successfully!', token, user: newUser });
});

authRouter.get('/me', authenticateToken, (req: Request, res: Response) => {
  return res.json({ user: req.user });
});

authRouter.get('/users', (req: Request, res: Response) => {
  const users = db.prepare('SELECT id, username, name, role, department FROM users').all();
  return res.json({ users });
});
