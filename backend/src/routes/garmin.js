import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import garminService from '../services/garmin.service.js';
import db from '../database/init.js';

const router = express.Router();

// Connect to Garmin
router.post('/connect', authenticateToken, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Garmin email and password are required' });
    }

    // Login to Garmin
    const result = await garminService.login(req.user.userId, email, password);

    // Save credentials (in production, encrypt these!)
    db.prepare(`
      INSERT OR REPLACE INTO garmin_credentials (user_id, email, password)
      VALUES (?, ?, ?)
    `).run(req.user.userId, email, password);

    res.json(result);
  } catch (error) {
    console.error('Garmin connection error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get training plan
router.get('/training-plan', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    // Check if connected
    const credentials = db.prepare('SELECT * FROM garmin_credentials WHERE user_id = ?').get(req.user.userId);
    if (!credentials) {
      return res.status(400).json({ error: 'Not connected to Garmin. Please connect first.' });
    }

    // Try to get client, if not exists, login again
    let client = garminService.getClient(req.user.userId);
    if (!client) {
      await garminService.login(req.user.userId, credentials.email, credentials.password);
    }

    const workouts = await garminService.getTrainingPlan(req.user.userId, startDate, endDate);

    res.json({ workouts });
  } catch (error) {
    console.error('Error fetching training plan:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get workout details
router.get('/workout/:workoutId', authenticateToken, async (req, res) => {
  try {
    const { workoutId } = req.params;

    const credentials = db.prepare('SELECT * FROM garmin_credentials WHERE user_id = ?').get(req.user.userId);
    if (!credentials) {
      return res.status(400).json({ error: 'Not connected to Garmin' });
    }

    let client = garminService.getClient(req.user.userId);
    if (!client) {
      await garminService.login(req.user.userId, credentials.email, credentials.password);
    }

    const workout = await garminService.getWorkoutDetails(req.user.userId, workoutId);

    res.json({ workout });
  } catch (error) {
    console.error('Error fetching workout:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check connection status
router.get('/status', authenticateToken, (req, res) => {
  const credentials = db.prepare('SELECT email FROM garmin_credentials WHERE user_id = ?').get(req.user.userId);
  const isConnected = !!credentials;

  res.json({
    connected: isConnected,
    email: credentials?.email
  });
});

// Disconnect
router.post('/disconnect', authenticateToken, (req, res) => {
  garminService.disconnect(req.user.userId);
  db.prepare('DELETE FROM garmin_credentials WHERE user_id = ?').run(req.user.userId);

  res.json({ success: true, message: 'Disconnected from Garmin' });
});

export default router;
