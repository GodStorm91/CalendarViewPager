import React, { useEffect, useRef } from 'react';

// Get site key from environment variable, or use empty string in development
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

export default function ReCaptcha({ onVerify, onExpire, onError }) {
  const recaptchaRef = useRef(null);

  useEffect(() => {
    // If no site key is configured, skip CAPTCHA rendering
    if (!RECAPTCHA_SITE_KEY) {
      console.warn('⚠️  RECAPTCHA_SITE_KEY not configured. CAPTCHA disabled.');
      // Automatically call onVerify with null to allow form submission in dev
      if (onVerify) {
        onVerify(null);
      }
      return;
    }

    // Wait for grecaptcha to be available
    const checkRecaptcha = setInterval(() => {
      if (window.grecaptcha && window.grecaptcha.render) {
        clearInterval(checkRecaptcha);
        renderRecaptcha();
      }
    }, 100);

    const renderRecaptcha = () => {
      if (recaptchaRef.current && !recaptchaRef.current.hasChildNodes()) {
        try {
          window.grecaptcha.render(recaptchaRef.current, {
            sitekey: RECAPTCHA_SITE_KEY,
            callback: onVerify,
            'expired-callback': onExpire || (() => {}),
            'error-callback': onError || (() => {})
          });
        } catch (error) {
          console.error('Error rendering reCAPTCHA:', error);
        }
      }
    };

    return () => {
      clearInterval(checkRecaptcha);
    };
  }, [onVerify, onExpire, onError]);

  // If no site key, don't render anything
  if (!RECAPTCHA_SITE_KEY) {
    return null;
  }

  return <div ref={recaptchaRef} className="flex justify-center mb-4"></div>;
}

// Helper function to reset the CAPTCHA
export function resetRecaptcha() {
  if (window.grecaptcha && window.grecaptcha.reset) {
    window.grecaptcha.reset();
  }
}
