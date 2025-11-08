import { google } from 'googleapis';
import db from '../database/init.js';

class GoogleService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  getAuthUrl() {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  async getTokenFromCode(code) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  async saveTokens(userId, tokens) {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO google_tokens
      (user_id, access_token, refresh_token, token_type, expiry_date)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      userId,
      tokens.access_token,
      tokens.refresh_token,
      tokens.token_type,
      tokens.expiry_date
    );
  }

  async getTokens(userId) {
    const stmt = db.prepare('SELECT * FROM google_tokens WHERE user_id = ?');
    return stmt.get(userId);
  }

  async getCalendarClient(userId) {
    const tokens = await this.getTokens(userId);
    if (!tokens) {
      throw new Error('No Google Calendar connection found. Please connect your Google Calendar.');
    }

    this.oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_type: tokens.token_type,
      expiry_date: tokens.expiry_date
    });

    return google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  async listCalendars(userId) {
    const calendar = await this.getCalendarClient(userId);
    const response = await calendar.calendarList.list();
    return response.data.items;
  }

  async getEvents(userId, calendarId = 'primary', timeMin, timeMax) {
    const calendar = await this.getCalendarClient(userId);

    const response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: timeMin || new Date().toISOString(),
      timeMax: timeMax,
      singleEvents: true,
      orderBy: 'startTime'
    });

    return response.data.items;
  }

  async createEvent(userId, calendarId = 'primary', eventData) {
    const calendar = await this.getCalendarClient(userId);

    const event = {
      summary: eventData.summary,
      description: eventData.description,
      start: {
        dateTime: eventData.startDateTime,
        timeZone: eventData.timeZone || 'UTC'
      },
      end: {
        dateTime: eventData.endDateTime,
        timeZone: eventData.timeZone || 'UTC'
      },
      colorId: eventData.colorId || '9', // Blue for workouts
      extendedProperties: {
        private: {
          source: 'garmin',
          garminWorkoutId: eventData.garminWorkoutId
        }
      }
    };

    const response = await calendar.events.insert({
      calendarId: calendarId,
      resource: event
    });

    return response.data;
  }

  async updateEvent(userId, calendarId = 'primary', eventId, eventData) {
    const calendar = await this.getCalendarClient(userId);

    const event = {
      summary: eventData.summary,
      description: eventData.description,
      start: {
        dateTime: eventData.startDateTime,
        timeZone: eventData.timeZone || 'UTC'
      },
      end: {
        dateTime: eventData.endDateTime,
        timeZone: eventData.timeZone || 'UTC'
      }
    };

    const response = await calendar.events.update({
      calendarId: calendarId,
      eventId: eventId,
      resource: event
    });

    return response.data;
  }

  async deleteEvent(userId, calendarId = 'primary', eventId) {
    const calendar = await this.getCalendarClient(userId);

    await calendar.events.delete({
      calendarId: calendarId,
      eventId: eventId
    });

    return { success: true };
  }
}

export default new GoogleService();
