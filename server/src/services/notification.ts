import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

interface NotificationPayload {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  message: string;
  type: 'alert' | 'info' | 'success' | 'warning';
}

export async function sendEmailNotification(payload: NotificationPayload): Promise<void> {
  const { recipientEmail, recipientName, subject, message } = payload;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><title>${subject}</title></head>
    <body style="font-family: 'Helvetica Neue', Arial, sans-serif; background:#F8FAFC; margin:0; padding:20px;">
      <div style="max-width:600px; margin:0 auto; background:white; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.1);">
        <div style="background:#091C3E; padding:24px 32px; border-bottom:4px solid #CC322C;">
          <h1 style="color:white; font-size:18px; margin:0; font-weight:900; letter-spacing:1px;">SAME DAY ASSIST</h1>
          <p style="color:#CC322C; font-size:10px; margin:4px 0 0; letter-spacing:2px; font-weight:700;">EMERGENCY ASSIST NETWORK • SOUTH AFRICA</p>
        </div>
        <div style="padding:32px;">
          <p style="color:#475569; font-size:14px; margin:0 0 8px;">Dear ${recipientName},</p>
          <div style="background:#F1F5F9; border-left:4px solid #CC322C; padding:16px; border-radius:4px; margin:16px 0;">
            <p style="color:#1E293B; font-size:14px; margin:0; line-height:1.6;">${message}</p>
          </div>
          <p style="color:#94A3B8; font-size:11px; margin-top:24px;">If you did not request this action, please contact us immediately at <a href="mailto:support@samedayassist.co.za" style="color:#CC322C;">support@samedayassist.co.za</a></p>
        </div>
        <div style="background:#091C3E; padding:16px 32px; text-align:center;">
          <p style="color:#475569; font-size:10px; margin:0;">© 2026 Same Day Assist (Pty) Ltd • Soweto, Johannesburg, South Africa</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
      // Development: log to console
      console.log(`\n📧 [Email Notification]\nTo: ${recipientEmail}\nSubject: ${subject}\nMessage: ${message}\n`);
      return;
    }

    await transporter.sendMail({
      from: `"Same Day Assist" <${process.env.SMTP_FROM || 'noreply@samedayassist.co.za'}>`,
      to: recipientEmail,
      subject,
      html,
    });
  } catch (error) {
    console.error('[Notifications/Email] Failed to send email:', error);
  }
}

export async function sendSMSNotification(phone: string, message: string): Promise<void> {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    // Development: log to console
    console.log(`\n📱 [SMS Notification]\nTo: ${phone}\nMessage: ${message}\n`);
    return;
  }

  try {
    const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await twilio.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
  } catch (error) {
    console.error('[Notifications/SMS] Failed to send SMS:', error);
  }
}

export async function dispatchNotification(params: {
  userId?: string;
  email?: string;
  phone?: string;
  name: string;
  subject: string;
  message: string;
  type?: 'alert' | 'info' | 'success' | 'warning';
  channels?: { email: boolean; sms: boolean };
}): Promise<void> {
  const { email, phone, name, subject, message, type = 'info', channels } = params;

  const promises: Promise<void>[] = [];

  if (channels?.email !== false && email) {
    promises.push(sendEmailNotification({ recipientEmail: email, recipientName: name, subject, message, type }));
  }

  if (channels?.sms !== false && phone) {
    promises.push(sendSMSNotification(phone, `Same Day Assist: ${subject} — ${message}`));
  }

  await Promise.allSettled(promises);
}
