import garminService from './garmin.service.js';
import googleService from './google.service.js';
import db from '../database/init.js';

class SyncService {
  async syncGarminToGoogle(userId, startDate, endDate, calendarId = 'primary') {
    try {
      // Get Garmin workouts
      const garminWorkouts = await garminService.getTrainingPlan(userId, startDate, endDate);

      if (!garminWorkouts || garminWorkouts.length === 0) {
        return {
          success: true,
          message: 'No workouts found in Garmin for the specified date range',
          synced: 0
        };
      }

      let syncedCount = 0;
      const errors = [];

      for (const workout of garminWorkouts) {
        try {
          // Check if this workout is already synced
          const existingMapping = db.prepare(
            'SELECT * FROM sync_mappings WHERE user_id = ? AND garmin_workout_id = ?'
          ).get(userId, workout.workoutId?.toString());

          if (existingMapping) {
            // Update existing event
            await googleService.updateEvent(userId, calendarId, existingMapping.google_event_id, {
              summary: workout.workoutName || 'Garmin Workout',
              description: this.formatWorkoutDescription(workout),
              startDateTime: workout.scheduledDate,
              endDateTime: this.calculateEndTime(workout.scheduledDate, workout.duration),
              timeZone: 'UTC'
            });

            // Update sync timestamp
            db.prepare(
              'UPDATE sync_mappings SET last_synced = CURRENT_TIMESTAMP WHERE id = ?'
            ).run(existingMapping.id);
          } else {
            // Create new event
            const googleEvent = await googleService.createEvent(userId, calendarId, {
              summary: workout.workoutName || 'Garmin Workout',
              description: this.formatWorkoutDescription(workout),
              startDateTime: workout.scheduledDate,
              endDateTime: this.calculateEndTime(workout.scheduledDate, workout.duration),
              timeZone: 'UTC',
              garminWorkoutId: workout.workoutId?.toString()
            });

            // Save mapping
            db.prepare(`
              INSERT INTO sync_mappings (user_id, garmin_workout_id, google_event_id)
              VALUES (?, ?, ?)
            `).run(userId, workout.workoutId?.toString(), googleEvent.id);
          }

          syncedCount++;
        } catch (error) {
          console.error(`Error syncing workout ${workout.workoutId}:`, error);
          errors.push({ workoutId: workout.workoutId, error: error.message });
        }
      }

      // Log sync history
      db.prepare(`
        INSERT INTO sync_history (user_id, sync_type, status, items_synced, error_message)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        userId,
        'garmin_to_google',
        errors.length === 0 ? 'success' : 'partial',
        syncedCount,
        errors.length > 0 ? JSON.stringify(errors) : null
      );

      return {
        success: true,
        synced: syncedCount,
        total: garminWorkouts.length,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      console.error('Sync error:', error);

      // Log failed sync
      db.prepare(`
        INSERT INTO sync_history (user_id, sync_type, status, items_synced, error_message)
        VALUES (?, ?, ?, ?, ?)
      `).run(userId, 'garmin_to_google', 'failed', 0, error.message);

      throw error;
    }
  }

  async syncGoogleToGarmin(userId, startDate, endDate, calendarId = 'primary') {
    try {
      // Get Google Calendar events that were originally from Garmin
      const events = await googleService.getEvents(userId, calendarId, startDate, endDate);

      // Filter events that have Garmin source
      const garminEvents = events.filter(event =>
        event.extendedProperties?.private?.source === 'garmin'
      );

      if (garminEvents.length === 0) {
        return {
          success: true,
          message: 'No Garmin-sourced events found to sync back',
          synced: 0
        };
      }

      let syncedCount = 0;
      const errors = [];

      for (const event of garminEvents) {
        try {
          const garminWorkoutId = event.extendedProperties.private.garminWorkoutId;

          // Attempt to update Garmin workout
          const result = await garminService.updateWorkout(userId, garminWorkoutId, {
            name: event.summary,
            description: event.description,
            scheduledDate: event.start.dateTime
          });

          if (result.success) {
            syncedCount++;
          } else {
            errors.push({
              eventId: event.id,
              error: result.message
            });
          }
        } catch (error) {
          console.error(`Error syncing event ${event.id}:`, error);
          errors.push({ eventId: event.id, error: error.message });
        }
      }

      // Log sync history
      db.prepare(`
        INSERT INTO sync_history (user_id, sync_type, status, items_synced, error_message)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        userId,
        'google_to_garmin',
        errors.length === 0 ? 'success' : 'partial',
        syncedCount,
        errors.length > 0 ? JSON.stringify(errors) : null
      );

      return {
        success: true,
        synced: syncedCount,
        total: garminEvents.length,
        errors: errors.length > 0 ? errors : undefined,
        note: 'Garmin API has limited write access. Some updates may need to be done manually.'
      };
    } catch (error) {
      console.error('Sync error:', error);

      db.prepare(`
        INSERT INTO sync_history (user_id, sync_type, status, items_synced, error_message)
        VALUES (?, ?, ?, ?, ?)
      `).run(userId, 'google_to_garmin', 'failed', 0, error.message);

      throw error;
    }
  }

  async getSyncHistory(userId, limit = 10) {
    const stmt = db.prepare(`
      SELECT * FROM sync_history
      WHERE user_id = ?
      ORDER BY synced_at DESC
      LIMIT ?
    `);
    return stmt.all(userId, limit);
  }

  formatWorkoutDescription(workout) {
    let description = `Garmin Training Plan Workout\n\n`;

    if (workout.sportType) {
      description += `Sport: ${workout.sportType}\n`;
    }

    if (workout.duration) {
      description += `Duration: ${this.formatDuration(workout.duration)}\n`;
    }

    if (workout.description) {
      description += `\nDetails: ${workout.description}\n`;
    }

    description += `\n🔗 Synced from Garmin Connect`;

    return description;
  }

  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  calculateEndTime(startDateTime, durationSeconds = 3600) {
    const start = new Date(startDateTime);
    const end = new Date(start.getTime() + (durationSeconds * 1000));
    return end.toISOString();
  }
}

export default new SyncService();
