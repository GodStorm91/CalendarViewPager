import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Skip email setup if credentials not provided (development mode)
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('⚠️  Email credentials not configured. OTP emails will be logged to console.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Verify connection
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Email service error:', error);
      } else {
        console.log('✅ Email service is ready');
      }
    });
  }

  async sendOTPEmail(email, otpCode) {
    const subject = 'Your Verification Code - Garmin Calendar Sync';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #667eea; text-align: center; letter-spacing: 8px; padding: 20px; background: white; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏃 Garmin Calendar Sync</h1>
          </div>
          <div class="content">
            <h2>Verify Your Email</h2>
            <p>Thank you for registering! To complete your registration, please use the verification code below:</p>

            <div class="otp-code">${otpCode}</div>

            <p><strong>This code will expire in 10 minutes.</strong></p>

            <p>If you didn't request this code, please ignore this email.</p>

            <p>Best regards,<br>Garmin Calendar Sync Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // If no transporter (development), just log to console
    if (!this.transporter) {
      console.log('\n🔐 OTP EMAIL (Development Mode):');
      console.log(`To: ${email}`);
      console.log(`Subject: ${subject}`);
      console.log(`OTP Code: ${otpCode}`);
      console.log('Expires in: 10 minutes\n');
      return { success: true, development: true };
    }

    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
        subject,
        html,
      });

      console.log('✅ OTP email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send OTP email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendWelcomeEmail(email) {
    const subject = 'Welcome to Garmin Calendar Sync!';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome!</h1>
          </div>
          <div class="content">
            <h2>You're all set!</h2>
            <p>Your account has been successfully created. You can now:</p>
            <ul>
              <li>Connect your Garmin account</li>
              <li>Connect your Google Calendar</li>
              <li>Sync your training plans automatically</li>
              <li>View all workouts in one dashboard</li>
            </ul>
            <p>Get started by connecting your accounts in the dashboard!</p>
            <p>Best regards,<br>Garmin Calendar Sync Team</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // If no transporter (development), just log to console
    if (!this.transporter) {
      console.log(`\n📧 WELCOME EMAIL (Development Mode) sent to: ${email}\n`);
      return { success: true, development: true };
    }

    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
        subject,
        html,
      });

      console.log('✅ Welcome email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
      // Don't throw error for welcome email, it's not critical
      return { success: false };
    }
  }
}

export default new EmailService();
