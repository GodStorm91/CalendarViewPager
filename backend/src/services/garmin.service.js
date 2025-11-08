import { GarminConnect } from 'garmin-connect';

class GarminService {
  constructor() {
    this.clients = new Map(); // userId -> GarminConnect client
  }

  async login(userId, email, password) {
    try {
      const client = new GarminConnect({
        username: email,
        password: password
      });

      await client.login();
      this.clients.set(userId, client);

      return { success: true, message: 'Connected to Garmin successfully' };
    } catch (error) {
      console.error('Garmin login error:', error);
      throw new Error('Failed to connect to Garmin: ' + error.message);
    }
  }

  getClient(userId) {
    return this.clients.get(userId);
  }

  async getTrainingPlan(userId, startDate, endDate) {
    const client = this.getClient(userId);
    if (!client) {
      throw new Error('Not connected to Garmin. Please login first.');
    }

    try {
      // Get scheduled workouts
      const workouts = await client.getWorkouts(startDate, endDate);
      return workouts;
    } catch (error) {
      console.error('Error fetching Garmin training plan:', error);
      throw error;
    }
  }

  async getWorkoutDetails(userId, workoutId) {
    const client = this.getClient(userId);
    if (!client) {
      throw new Error('Not connected to Garmin. Please login first.');
    }

    try {
      const workout = await client.getWorkout(workoutId);
      return workout;
    } catch (error) {
      console.error('Error fetching workout details:', error);
      throw error;
    }
  }

  async createWorkout(userId, workoutData) {
    const client = this.getClient(userId);
    if (!client) {
      throw new Error('Not connected to Garmin. Please login first.');
    }

    try {
      // This is a placeholder - Garmin API has limited write access
      // You might need to use unofficial API endpoints or Garmin's official API
      console.log('Creating workout:', workoutData);

      // For now, return a mock response
      return {
        success: false,
        message: 'Garmin API has limited write access. You may need to manually create workouts in Garmin Connect.'
      };
    } catch (error) {
      console.error('Error creating workout:', error);
      throw error;
    }
  }

  async updateWorkout(userId, workoutId, workoutData) {
    const client = this.getClient(userId);
    if (!client) {
      throw new Error('Not connected to Garmin. Please login first.');
    }

    try {
      // Similar limitation as createWorkout
      console.log('Updating workout:', workoutId, workoutData);

      return {
        success: false,
        message: 'Garmin API has limited write access. Please update workouts directly in Garmin Connect.'
      };
    } catch (error) {
      console.error('Error updating workout:', error);
      throw error;
    }
  }

  disconnect(userId) {
    this.clients.delete(userId);
  }
}

export default new GarminService();
