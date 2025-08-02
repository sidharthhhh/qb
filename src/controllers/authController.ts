import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../config/db';

export const register = async (req: Request, res: Response) => {
  const { full_name, email, password } = req.body;
  try {
    const [user] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if ((user as any[]).length > 0) return res.status(400).json({ msg: 'Email already exists' });

    const hashed = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)', [full_name, email, hashed]);
    res.status(201).json({ msg: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Registration failed', error: err });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = (rows as any[])[0];
    if (!user) return res.status(400).json({ msg: 'Invalid email or password' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: 'Invalid email or password' });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name } });
  } catch (err) {
    res.status(500).json({ msg: 'Login failed', error: err });
  }
};
