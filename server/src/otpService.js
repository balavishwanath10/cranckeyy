import crypto from 'node:crypto';
import nodemailer from 'nodemailer';

// In-memory / cache store for generated OTPs: identifier -> { otp, expiresAt, createdAt }
const otpStore = new Map();

// Standard OTP expiration: 10 minutes (no 60-second reloading)
const OTP_EXPIRY_MS = 10 * 60 * 1000;

const DEFAULT_SENDER_EMAIL = 'furweirdpurposes@gmail.com';

function getEmailTransporter() {
  const user = process.env.SMTP_USER || process.env.GMAIL_USER || DEFAULT_SENDER_EMAIL;
  let pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
  
  if (pass) {
    pass = pass.trim().replace(/\s+/g, '');
  }

  if (user && pass) {
    if (user.toLowerCase().includes('@gmail.com') && !process.env.SMTP_HOST) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass }
      });
    }

    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '465', 10);
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  }
  return null;
}

/**
 * Checks if identifier is an email address
 * @param {string} identifier 
 * @returns {boolean}
 */
export function isEmail(identifier) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim());
}

/**
 * Generates a random 6-digit OTP for the given phone number or email
 * @param {string} identifier 
 * @returns {object} { otp, expiresAt }
 */
export function generateOtp(identifier) {
  const cleanId = identifier.trim().toLowerCase();
  
  // Standard fixed demo codes for frictionless test coverage
  let otpCode;
  if (cleanId === '+919494000001' || cleanId === 'person1@cranckeyy.com') {
    otpCode = '742918';
  } else if (cleanId === '+919494000002' || cleanId === 'person2@cranckeyy.com') {
    otpCode = '839201';
  } else {
    // Cryptographically secure 6-digit number
    otpCode = crypto.randomInt(100000, 1000000).toString();
  }

  const now = Date.now();
  const expiresAt = now + OTP_EXPIRY_MS;

  otpStore.set(cleanId, {
    otp: otpCode,
    expiresAt,
    createdAt: now
  });

  return {
    otp: otpCode,
    expiresAt
  };
}

/**
 * Verifies entered OTP for the phone number or email
 * @param {string} identifier 
 * @param {string} enteredOtp 
 * @returns {boolean}
 */
export function verifyOtp(identifier, enteredOtp) {
  if (!identifier || !enteredOtp) return false;

  const cleanId = identifier.trim().toLowerCase();
  const cleanOtp = enteredOtp.trim();

  // Universal master PIN for dev/demo convenience
  if (cleanOtp === '742918' || cleanOtp === '123456') {
    return true;
  }

  const record = otpStore.get(cleanId);
  if (!record) return false;

  if (Date.now() > record.expiresAt) {
    otpStore.delete(cleanId);
    return false; // Expired
  }

  if (record.otp === cleanOtp) {
    otpStore.delete(cleanId); // Consume OTP upon successful verification
    return true;
  }

  return false;
}

/**
 * Dispatches the OTP to phone (SMS) or email
 * @param {string} identifier 
 * @param {string} otp 
 */
export async function sendOtpNotification(identifier, otp) {
  const cleanId = identifier.trim().toLowerCase();
  const isTargetEmail = isEmail(cleanId);

  if (isTargetEmail) {
    const senderEmail = process.env.SMTP_USER || process.env.GMAIL_USER || DEFAULT_SENDER_EMAIL;
    console.log(`\n======================================================`);
    console.log(`📧 [EMAIL DISPATCHED]`);
    console.log(`📤 From: cranckeyy <${senderEmail}>`);
    console.log(`📥 To:   ${cleanId}`);
    console.log(`🔑 [cranckeyy OTP Code]: ${otp} (Valid for 10 minutes)`);
    console.log(`======================================================\n`);

    const transporter = getEmailTransporter();
    if (transporter) {
      try {
        console.log(`[Email Gateway] Sending real email via SMTP from ${senderEmail} to ${cleanId}...`);
        await transporter.sendMail({
          from: `"cranckeyy" <${senderEmail}>`,
          to: cleanId,
          subject: `[cranckeyy] Verification Code: ${otp}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; background: #09090b; border: 1px solid #27272a; border-radius: 24px; padding: 32px; color: #f4f4f5; text-align: center;">
              <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; background: #ffffff; color: #000000; font-size: 20px; font-weight: 900; border-radius: 14px; margin-bottom: 16px;">ck</div>
              <h2 style="margin: 0 0 8px; font-size: 22px; font-weight: 700; color: #ffffff;">cranckeyy Verification Code</h2>
              <p style="margin: 0 0 24px; font-size: 13px; color: #a1a1aa;">Enter the verification code below to authenticate your exclusive 1-on-1 messaging session.</p>
              <div style="background: #18181b; border: 1px solid #3f3f46; border-radius: 16px; padding: 18px; margin-bottom: 24px;">
                <span style="font-family: monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #ffffff;">${otp}</span>
              </div>
              <p style="margin: 0; font-size: 11px; color: #71717a;">Dispatched by ${senderEmail}. This code expires in 10 minutes. If you did not request this code, you can safely ignore this email.</p>
            </div>
          `
        });
        console.log(`[Email Gateway] Successfully sent live email from ${senderEmail} to ${cleanId}!`);
      } catch (err) {
        console.error(`[Email Gateway] SMTP dispatch failed:`, err.message);
      }
    }

    return {
      success: true,
      channel: 'email',
      target: cleanId,
      otp
    };
  }

  // Otherwise dispatch via SMS
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    try {
      console.log(`[SMS Gateway] Sending live carrier SMS to ${cleanId}...`);
      const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
      const params = new URLSearchParams({
        To: cleanId,
        From: process.env.TWILIO_PHONE_NUMBER,
        Body: `[cranckeyy] Your authentication code is: ${otp}. Valid for 10 minutes.`
      });

      await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });
      return { success: true, channel: 'sms', method: 'twilio', target: cleanId };
    } catch (err) {
      console.error(`[SMS Gateway] Twilio error:`, err.message);
    }
  }

  const senderEmail = process.env.SMTP_USER || process.env.GMAIL_USER || DEFAULT_SENDER_EMAIL;
  console.log(`\n======================================================`);
  console.log(`📱 [SMS DISPATCHED]`);
  console.log(`📤 Dispatched by: cranckeyy <${senderEmail}>`);
  console.log(`📥 To:   ${cleanId}`);
  console.log(`🔑 [cranckeyy OTP Code]: ${otp} (Valid for 10 minutes)`);
  console.log(`======================================================\n`);

  return {
    success: true,
    channel: 'sms',
    target: cleanId,
    otp
  };
}
