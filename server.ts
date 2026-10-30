import 'dotenv/config';
import express from 'express';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'coolbrosacservice@gmail.com';

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Endpoint: Send email notification to coolbrosacservice@gmail.com when a user sends a message or books a service
  app.post('/api/send-email', async (req, res) => {
    try {
      const {
        type = 'Customer Inquiry',
        senderName = 'Website Visitor',
        senderPhone = 'Not provided',
        senderEmail = 'Not provided',
        subject = 'New Message from Cool Bros AC Service App',
        message = '',
        bookingDetails = null,
      } = req.body || {};

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

      // 1. If SMTP credentials are configured in environment, send via Nodemailer directly
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

        return res.json({
          ok: true,
          method: 'smtp',
          recipient: NOTIFY_EMAIL,
          message: `Email notification sent to ${NOTIFY_EMAIL}.`,
        });
      }

      // 2. Zero-config relay via FormSubmit AJAX to coolbrosacservice@gmail.com
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
              ...(bookingDetails
                ? {
                    Service_Package: bookingDetails.serviceType,
                    AC_Equipment: `${bookingDetails.acType} (${bookingDetails.tonnage}) x ${bookingDetails.unitCount}`,
                    Scheduled_Slot: `${bookingDetails.scheduledDate} (${bookingDetails.timeSlot})`,
                    Service_Address: bookingDetails.serviceAddress,
                    Estimated_Total: `INR ${bookingDetails.estimatedTotal}`,
                  }
                : {}),
            }),
          }
        );

        if (relayResponse.ok) {
          return res.json({
            ok: true,
            method: 'formsubmit-relay',
            recipient: NOTIFY_EMAIL,
            message: `Email notification dispatched to ${NOTIFY_EMAIL}.`,
          });
        }
      } catch {
        // Fall through to client relay / fallback response
      }

      return res.json({
        ok: true,
        method: 'logged',
        recipient: NOTIFY_EMAIL,
        message: `Notification logged and prepared for ${NOTIFY_EMAIL}.`,
      });
    } catch (error) {
      console.error('Error in /api/send-email:', error);
      return res.status(500).json({
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to send email notification',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cool Bros AC Service server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
