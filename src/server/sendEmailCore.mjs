import nodemailer from 'nodemailer';

const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'coolbrosacservice@gmail.com';

// Simple in-memory IP rate limiter: max 5 requests per 10 minutes per IP
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

function isRateLimited(ip) {
  const now = Date.now();
  const key = String(ip || 'unknown').slice(0, 64);
  const timestamps = (rateLimitMap.get(key) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  if (timestamps.length >= RATE_LIMIT_MAX) {
    rateLimitMap.set(key, timestamps);
    return true;
  }
  timestamps.push(now);
  rateLimitMap.set(key, timestamps);
  return false;
}

function sanitizeSingleLine(val, maxLen = 120) {
  return String(val || '')
    .replace(/[\r\n<>]/g, ' ')
    .trim()
    .slice(0, maxLen);
}

function isValidEmailAddress(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length < 5 || trimmed.length > 120) return false;
  if (/[\r\n<>]/.test(trimmed)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
}

export async function processSendEmailRequest(rawBody, clientIp = 'unknown') {
  if (isRateLimited(clientIp)) {
    return {
      statusCode: 429,
      payload: {
        ok: false,
        error: 'Too many requests. Please message us on WhatsApp (+91 9560415262) or try again later.',
      },
    };
  }

  if (!rawBody || typeof rawBody !== 'object') {
    return {
      statusCode: 400,
      payload: { ok: false, error: 'Invalid request payload.' },
    };
  }

  // Honeypot anti-bot check (_gotcha must be empty)
  if (rawBody._gotcha && String(rawBody._gotcha).trim().length > 0) {
    return {
      statusCode: 200,
      payload: { ok: true, method: 'honeypot-filtered' },
    };
  }

  const type = sanitizeSingleLine(rawBody.type || 'Customer Inquiry', 60);
  const senderName = sanitizeSingleLine(rawBody.senderName, 100);
  const senderPhone = sanitizeSingleLine(rawBody.senderPhone || 'WhatsApp Direct', 30);
  const rawEmail = sanitizeSingleLine(rawBody.senderEmail || '', 120);
  const senderEmail = isValidEmailAddress(rawEmail) ? rawEmail : 'Not provided';
  const subject = sanitizeSingleLine(
    rawBody.subject || 'New Inquiry from Cool Bros AC Service',
    80
  );
  const message = String(rawBody.message || '')
    .trim()
    .slice(0, 1200);

  if (senderName.length < 2 || message.length < 5) {
    return {
      statusCode: 400,
      payload: {
        ok: false,
        error: 'Name (min 2 chars) and message (min 5 chars) are required.',
      },
    };
  }

  const emailSubject = `[Cool Bros AC App] ${subject} - ${senderName}`;
  const textBody = [
    `New ${type} received on Cool Bros AC Service Website`,
    `----------------------------------------`,
    `Name: ${senderName}`,
    `Contact Channel: ${senderPhone}`,
    `Verified Email: ${senderEmail}`,
    `Subject: ${subject}`,
    `\nMessage:\n${message}`,
    `\n----------------------------------------`,
  ].join('\n');

  // 1. Direct SMTP delivery when configured
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Cool Bros AC Website" <${process.env.SMTP_USER}>`,
      to: NOTIFY_EMAIL,
      // Never set unvalidated attacker-controlled replyTo
      replyTo: isValidEmailAddress(senderEmail) ? senderEmail : undefined,
      subject: emailSubject,
      text: textBody,
    });

    return {
      statusCode: 200,
      payload: {
        ok: true,
        method: 'smtp',
        recipient: NOTIFY_EMAIL,
      },
    };
  }

  // 2. FormSubmit AJAX Relay
  try {
    const relayResponse = await fetch(
      `https://formsubmit.co/ajax/${encodeURIComponent(NOTIFY_EMAIL)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          _subject: emailSubject,
          _template: 'table',
          Notification_Type: type,
          Customer_Name: senderName,
          Contact_Channel: senderPhone,
          Customer_Email: senderEmail,
          Subject: subject,
          Message: message,
        }),
      }
    );

    if (relayResponse.ok) {
      return {
        statusCode: 200,
        payload: {
          ok: true,
          method: 'formsubmit-relay',
          recipient: NOTIFY_EMAIL,
        },
      };
    }
  } catch {
    // Relay failed
  }

  return {
    statusCode: 503,
    payload: {
      ok: false,
      error: 'Email relay unavailable. Please send your inquiry via WhatsApp (+91 9560415262).',
    },
  };
}
