import { processSendEmailRequest } from '../../src/server/sendEmailCore.mjs';

export async function handler(event) {
  if (event.httpMethod && event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Method Not Allowed' }),
    };
  }

  if (event.body && event.body.length > 16384) {
    return {
      statusCode: 413,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Payload Too Large' }),
    };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const clientIp =
      event.headers?.['x-nf-client-connection-ip'] ||
      event.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
      'unknown';
    const result = await processSendEmailRequest(body, clientIp);
    return {
      statusCode: result.statusCode,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result.payload),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to send email notification',
      }),
    };
  }
}
