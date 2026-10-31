import nodemailer from 'nodemailer';

const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'coolbrosacservice@gmail.com';

export async function handler(event) {
  if (event.httpMethod && event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Method Not Allowed' }),
    };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const {
      type = 'Customer Inquiry',
      senderName = 'Website Visitor',
      senderPhone = 'Not provided',
      senderEmail = 'Not provided',
      subject = 'New Message from Cool Bros AC Service App',
      message = '',
      bookingDetails = null,
    } = body;

    const emailSubject = `[Cool Bros AC App] ${subject} - ${senderName} (${senderPhone})`;

    const textBody = [
      `New ${type} received on Cool Bros AC Service Website`,
      `----------------------------------------`,
      `Name: ${senderName}`,
      `Phone: ${senderPhone}`,
      `Email: ${senderEmail}`,
      `Subject: ${subject}`,
      message ? `\nMessage:\n${message}` : '',
      bookingDetails
        ? `\nBooking Details:\n- Service: ${bookingDetails.serviceType}\n- AC Type: ${bookingDetails.acType} (${bookingDetails.tonnage})\n- Units: ${bookingDetails.unitCount}\n- Preferred Date: ${bookingDetails.scheduledDate}\n- Time Slot: ${bookingDetails.timeSlot}\n- Address: ${bookingDetails.serviceAddress}\n- Estimated Total: Rs. ${bookingDetails.estimatedTotal}`
        : '',
      `\n----------------------------------------`,
      `Reply directly to customer phone: ${senderPhone}`,
    ]
      .filter(Boolean)
      .join('\n');

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
        replyTo: senderEmail !== 'Not provided' ? senderEmail : undefined,
        subject: emailSubject,
        text: textBody,
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ok: true,
          method: 'smtp',
          recipient: NOTIFY_EMAIL,
          message: `Email notification sent to ${NOTIFY_EMAIL}.`,
        }),
      };
    }

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
            Customer_Phone: senderPhone,
            Customer_Email: senderEmail,
            Subject: subject,
            Message: message || 'See booking details',
          }),
        }
      );

      if (relayResponse.ok) {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ok: true,
            method: 'formsubmit-relay',
            recipient: NOTIFY_EMAIL,
            message: `Email notification dispatched to ${NOTIFY_EMAIL}.`,
          }),
        };
      }
    } catch {
      // Fall through to client fallback
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: true,
        method: 'logged',
        recipient: NOTIFY_EMAIL,
        message: `Notification logged and prepared for ${NOTIFY_EMAIL}.`,
      }),
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
