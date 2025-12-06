import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User'; 

const router = express.Router();

// --- User Registration (Signup) ---
// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req: Request, res: Response) => {
  const { username, email, password, "confirm-password": confirmPassword } = req.body;

  // 1. Basic Validation
  if (!username || !email || !password || !confirmPassword) {
    return res.status(400).json({ msg: 'Please enter all fields.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ msg: 'Passwords do not match.' });
  }

  try {
    // 2. Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ msg: 'User with this email or username already exists.' });
    }

    // 3. Create new user object
    user = new User({
      user_id: uuidv4(), // Generate a unique user_id
      username,
      email,
      password_hash: password, // Will be hashed next
      join_date: new Date().toISOString(),
      // isAdmin, isBanned, etc. will use defaults (false) from schema
    });

    // 4. Hash the password
    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(password, salt);

    // 5. Save user to database
    await user.save();

    res.status(201).json({ msg: 'User registered successfully! Please login.' });

  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// --- User Login ---
// @route   POST /api/auth/login
// @desc    Authenticate user and get token
// @access  Public
router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body; // HTML form uses 'username' for both

  // 1. Basic Validation
  if (!username || !password) {
    return res.status(400).json({ msg: 'Please provide credentials.' });
  }

  try {
    // 2. Find user by email or username
    const user = await User.findOne({ 
      $or: [{ email: username }, { username: username }] 
    });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials.' });
    }

    // 3. Compare passwords
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials.' });
    }

    // 🛑 START: BAN CHECK IMPLEMENTATION 🛑
    if (user.isBanned) {
        // Use a generic error message (403 Forbidden is a good status code)
        return res.status(403).json({ msg: 'Access denied.' });
    }
    // 🛑 END: BAN CHECK IMPLEMENTATION 🛑

    // 4. Create and sign JWT
    const payload = {
      user: {
        id: user.user_id, // Use your unique user_id
        username: user.username
      }
    };

    const secretJWT = process.env.JWT_SECRET as string

    jwt.sign(
      payload,
      secretJWT,
      { expiresIn: '1h' }, // Token expires in 1 hour
      (err, token) => {
        if (err) throw err;
        // We now send the User object (including isAdmin) along with the token
        res.json({ 
            token,
            user: {
                id: user.user_id,
                username: user.username,
                email: user.email,
                // If username is "admin", they are automatically an Admin.
                isAdmin: user.username === "admin" || user.isAdmin === true
            }
        }); 
      }
    );

  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default  router;