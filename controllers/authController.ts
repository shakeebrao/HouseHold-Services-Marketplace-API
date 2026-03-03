import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { UserRole } from '../utils/enums';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST /api/users/register
export const register = async (req: Request, res: Response) => {
  try {
    const { full_name, email, password, role } = req.body;

    // Validate role
    const validRoles = Object.values(UserRole);
    if (!validRoles.includes(role)) {
      res.status(400).json({
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      });
      return;
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(409).json({ message: 'Email already registered.' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({ full_name, email, password_hash, role });

    res.status(201).json({
      message: 'User registered successfully!',
      data: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Failed to register user', error });
  }
};

// POST /api/users/login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

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
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Failed to login', error });
  }
};
