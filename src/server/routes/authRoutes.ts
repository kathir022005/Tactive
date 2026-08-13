import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../db/models.js';
import { JWT_SECRET, authenticateToken } from '../middleware/auth.js';

export const authRouter = Router();

// ── Login ──────────────────────────────────────────────────────────
authRouter.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const user = await User.findOne({ username }).lean();
  if (!user || user.password_hash !== password) {
    return res.status(401).json({ error: 'Invalid username or password credentials.' });
  }

  const tokenPayload = {
    id:         user._id.toString(),
    username:   user.username,
    name:       user.name,
    role:       user.role,
    department: user.department,
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });
  return res.json({ message: 'Login successful', token, user: tokenPayload });
});

// ── Register ────────────────────────────────────────────────────────
authRouter.post('/register', async (req: Request, res: Response) => {
  const { username, name, department, password } = req.body;

  if (!username || !name || !department || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const existing = await User.findOne({ username });
  if (existing) {
    return res.status(409).json({ error: 'Username already taken. Please choose another.' });
  }

  const newUser = await User.create({ username, password_hash: password, name, role: 'STANDARD', department });

  const tokenPayload = {
    id:         newUser._id.toString(),
    username:   newUser.username,
    name:       newUser.name,
    role:       newUser.role,
    department: newUser.department,
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });
  return res.status(201).json({ message: 'Account created successfully!', token, user: tokenPayload });
});

// ── /me ─────────────────────────────────────────────────────────────
authRouter.get('/me', authenticateToken, (req: Request, res: Response) => {
  return res.json({ user: req.user });
});

// ── /users (list all for switcher) ──────────────────────────────────
authRouter.get('/users', async (_req: Request, res: Response) => {
  const users = await User.find({}).select('_id username name role department').lean();
  const mapped = users.map(u => ({ id: u._id.toString(), username: u.username, name: u.name, role: u.role, department: u.department }));
  return res.json({ users: mapped });
});
