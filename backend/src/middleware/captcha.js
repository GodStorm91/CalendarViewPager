import captchaService from '../services/captcha.service.js';

export async function verifyCaptcha(req, res, next) {
  // Skip CAPTCHA in development if not configured
  if (!process.env.RECAPTCHA_SECRET_KEY) {
    console.warn('⚠️  CAPTCHA verification skipped - RECAPTCHA_SECRET_KEY not configured');
    return next();
  }

  const captchaToken = req.body.captchaToken;

  if (!captchaToken) {
    return res.status(400).json({
      error: 'CAPTCHA token is required',
      field: 'captcha'
    });
  }

  const clientIp = req.ip || req.connection.remoteAddress;
  const result = await captchaService.verifyCaptcha(captchaToken, clientIp);

  if (!result.success) {
    return res.status(400).json({
      error: 'CAPTCHA verification failed. Please try again.',
      field: 'captcha'
    });
  }

  // CAPTCHA verified successfully
  next();
}
