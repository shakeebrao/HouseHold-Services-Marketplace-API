import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { UserRole } from '../utils/enums';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST /api/users/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { full_name, email, password, role } = req.body;

    // Validate role
    const validRoles = Object.values(UserRole);
    if (!validRoles.includes(role)) {
      res.status(400).json({
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      });
      return;
    }

    // Check if email already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      res.status(409).json({ message: 'Email already registered.' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert user
    const result = await pool.query(
      'INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, full_name, email, role, created_at',
      [full_name, email, password_hash, role]
    );

    res.status(201).json({
      message: 'User registered successfully!',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Failed to register user', error });
  }
});

// POST /api/users/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    const user = result.rows[0];

    // Compare password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Failed to login', error });
  }
});

export default router;
