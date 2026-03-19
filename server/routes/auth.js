import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Profile } from '../models.js'; // Ensure we have the profile model imported
import { OAuth2Client } from 'google-auth-library';

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '30d',
  });
};

// ---------------------------------------------
// POST /api/auth/signup
// Handles registering user + creating a Profile
// ---------------------------------------------
router.post('/signup', async (req, res) => {
  const { email, password, full_name, usn } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // 1. Create the Authentication Account (email/password)
    const user = await User.create({
      email,
      password,
    });

    // 2. Automatically create the Profile for them (like Supabase Triggers did)
    const newProfile = await Profile.create({
      user_id: user._id.toString(),
      full_name,
      usn: usn || '',
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${full_name}`,
    });

    res.status(201).json({
      _id: user._id,
      email: user.email,
      profile: newProfile,
      token: generateToken(user._id),
      message: 'Signup successful!',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// ---------------------------------------------
// POST /api/auth/login
// Handles authenticating an existing user
// ---------------------------------------------
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      // Find their profile data
      const profile = await Profile.findOne({ user_id: user._id.toString() });

      res.json({
        _id: user._id,
        email: user.email,
        profile,
        token: generateToken(user._id),
        message: 'Login successful!',
      });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ---------------------------------------------
// POST /api/auth/google
// Handles Google Sign-In and Sign-Up
// ---------------------------------------------
router.post('/google', async (req, res) => {
  const { credential, clientId } = req.body;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID || clientId, // Allow fallback to the one sent by frontend if backend env isn't set
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    let user = await User.findOne({ email });
    let profile = null;

    if (!user) {
      // User doesn't exist, create a new user (without a password)
      user = await User.create({ email });

      // Create a profile for this new user
      profile = await Profile.create({
        user_id: user._id.toString(),
        full_name: name,
        usn: '',
        avatar_url: picture || `https://api.dicebear.com/7.x/initials/svg?seed=${name}`,
      });
    } else {
      // User exists, find their profile
      profile = await Profile.findOne({ user_id: user._id.toString() });
      if (!profile) {
        profile = await Profile.create({
          user_id: user._id.toString(),
          full_name: name,
          usn: '',
          avatar_url: picture || `https://api.dicebear.com/7.x/initials/svg?seed=${name}`,
        });
      }
    }

    res.json({
      _id: user._id,
      email: user.email,
      profile,
      token: generateToken(user._id),
      message: 'Google login successful!',
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(401).json({ error: 'Google authentication failed' });
  }
});

export default router;
