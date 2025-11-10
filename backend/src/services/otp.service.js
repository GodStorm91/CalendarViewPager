import db from '../database/init.js';
import emailService from './email.service.js';

class OTPService {
  // Generate a 6-digit OTP code
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Create and send OTP
  async createAndSendOTP(email) {
    try {
      // Clean up any existing unverified OTPs for this email
      db.prepare('DELETE FROM otps WHERE email = ? AND verified = 0').run(email);

      // Generate new OTP
      const otpCode = this.generateOTP();

      // Set expiration to 10 minutes from now
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      // Store OTP in database
      db.prepare(`
        INSERT INTO otps (email, otp_code, expires_at)
        VALUES (?, ?, ?)
      `).run(email, otpCode, expiresAt);

      // Send OTP via email
      await emailService.sendOTPEmail(email, otpCode);

      return {
        success: true,
        message: 'Verification code sent to your email',
        expiresIn: 600 // seconds
      };
    } catch (error) {
      console.error('Error creating OTP:', error);
      throw new Error('Failed to send verification code');
    }
  }

  // Verify OTP code
  verifyOTP(email, otpCode) {
    try {
      // Find the most recent unverified OTP for this email
      const otp = db.prepare(`
        SELECT * FROM otps
        WHERE email = ? AND otp_code = ? AND verified = 0
        ORDER BY created_at DESC
        LIMIT 1
      `).get(email, otpCode);

      if (!otp) {
        return {
          success: false,
          error: 'Invalid verification code'
        };
      }

      // Check if OTP has expired
      const now = new Date();
      const expiresAt = new Date(otp.expires_at);

      if (now > expiresAt) {
        return {
          success: false,
          error: 'Verification code has expired'
        };
      }

      // Mark OTP as verified
      db.prepare(`
        UPDATE otps SET verified = 1 WHERE id = ?
      `).run(otp.id);

      return {
        success: true,
        message: 'Email verified successfully'
      };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return {
        success: false,
        error: 'Failed to verify code'
      };
    }
  }

  // Check if email has been verified
  isEmailVerified(email) {
    const verifiedOTP = db.prepare(`
      SELECT * FROM otps
      WHERE email = ? AND verified = 1
      ORDER BY created_at DESC
      LIMIT 1
    `).get(email);

    return !!verifiedOTP;
  }

  // Clean up old OTPs (run periodically)
  cleanupExpiredOTPs() {
    try {
      const now = new Date().toISOString();
      const result = db.prepare(`
        DELETE FROM otps WHERE expires_at < ?
      `).run(now);

      if (result.changes > 0) {
        console.log(`🧹 Cleaned up ${result.changes} expired OTPs`);
      }
    } catch (error) {
      console.error('Error cleaning up OTPs:', error);
    }
  }

  // Resend OTP (with rate limiting)
  async resendOTP(email) {
    try {
      // Check if there's a recent OTP (within last 60 seconds)
      const recentOTP = db.prepare(`
        SELECT * FROM otps
        WHERE email = ?
        AND created_at > datetime('now', '-60 seconds')
        ORDER BY created_at DESC
        LIMIT 1
      `).get(email);

      if (recentOTP) {
        const timeLeft = 60 - Math.floor((Date.now() - new Date(recentOTP.created_at).getTime()) / 1000);
        return {
          success: false,
          error: `Please wait ${timeLeft} seconds before requesting a new code`
        };
      }

      // Create and send new OTP
      return await this.createAndSendOTP(email);
    } catch (error) {
      console.error('Error resending OTP:', error);
      throw new Error('Failed to resend verification code');
    }
  }
}

export default new OTPService();
