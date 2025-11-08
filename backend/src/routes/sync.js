import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import syncService from '../services/sync.service.js';

const router = express.Router();

// Sync Garmin to Google Calendar
router.post('/garmin-to-google', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, calendarId } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const result = await syncService.syncGarminToGoogle(
      req.user.userId,
      startDate,
      endDate,
      calendarId
    );

    res.json(result);
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Sync Google Calendar to Garmin
router.post('/google-to-garmin', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, calendarId } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const result = await syncService.syncGoogleToGarmin(
      req.user.userId,
      startDate,
      endDate,
      calendarId
    );

    res.json(result);
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get sync history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { limit } = req.query;
    const history = await syncService.getSyncHistory(req.user.userId, parseInt(limit) || 10);

    res.json({ history });
  } catch (error) {
    console.error('Error fetching sync history:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
