import axios from 'axios';

class CaptchaService {
  async verifyCaptcha(token, remoteIp = null) {
    if (!process.env.RECAPTCHA_SECRET_KEY) {
      console.warn('RECAPTCHA_SECRET_KEY not configured. Skipping verification.');
      // In development, if not configured, allow it to pass
      return { success: true, development: true };
    }

    try {
      const response = await axios.post(
        'https://www.google.com/recaptcha/api/siteverify',
        null,
        {
          params: {
            secret: process.env.RECAPTCHA_SECRET_KEY,
            response: token,
            remoteip: remoteIp
          }
        }
      );

      const { success, score, 'error-codes': errorCodes } = response.data;

      if (!success) {
        console.error('reCAPTCHA verification failed:', errorCodes);
        return {
          success: false,
          error: 'CAPTCHA verification failed',
          errorCodes
        };
      }

      // For reCAPTCHA v2, success is enough
      // For reCAPTCHA v3, you might want to check the score
      return {
        success: true,
        score: score || null
      };
    } catch (error) {
      console.error('Error verifying CAPTCHA:', error);
      return {
        success: false,
        error: 'Failed to verify CAPTCHA'
      };
    }
  }
}

export default new CaptchaService();
