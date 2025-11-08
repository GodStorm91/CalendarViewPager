import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import googleService from '../services/google.service.js';

const router = express.Router();

// Get Google OAuth URL
router.get('/auth-url', authenticateToken, (req, res) => {
  try {
    const authUrl = googleService.getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: error.message });
  }
});

// Handle OAuth callback
router.get('/callback', authenticateToken, async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    const tokens = await googleService.getTokenFromCode(code);
    await googleService.saveTokens(req.user.userId, tokens);

    // Redirect back to frontend
    res.redirect('http://localhost:5173/dashboard?google_connected=true');
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: error.message });
  }
});

// List calendars
router.get('/calendars', authenticateToken, async (req, res) => {
  try {
    const calendars = await googleService.listCalendars(req.user.userId);
    res.json({ calendars });
  } catch (error) {
    console.error('Error fetching calendars:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get events
router.get('/events', authenticateToken, async (req, res) => {
  try {
    const { calendarId, timeMin, timeMax } = req.query;

    const events = await googleService.getEvents(
      req.user.userId,
      calendarId || 'primary',
      timeMin,
      timeMax
    );

    res.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create event
router.post('/events', authenticateToken, async (req, res) => {
  try {
    const { calendarId, eventData } = req.body;

    const event = await googleService.createEvent(
      req.user.userId,
      calendarId || 'primary',
      eventData
    );

    res.json({ event });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update event
router.put('/events/:eventId', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { calendarId, eventData } = req.body;

    const event = await googleService.updateEvent(
      req.user.userId,
      calendarId || 'primary',
      eventId,
      eventData
    );

    res.json({ event });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete event
router.delete('/events/:eventId', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { calendarId } = req.query;

    await googleService.deleteEvent(
      req.user.userId,
      calendarId || 'primary',
      eventId
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check connection status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const tokens = await googleService.getTokens(req.user.userId);
    res.json({ connected: !!tokens });
  } catch (error) {
    res.json({ connected: false });
  }
});

export default router;
