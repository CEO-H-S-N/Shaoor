/**
 * Shaoor Email Utility — Production Email Transporter
 *
 * Sends transactional emails (OTP verification, password reset) to user inboxes.
 * Supports:
 *   1. Gmail SMTP via EMAIL_FROM + EMAIL_APP_PASSWORD (16-character Google App Password)
 *   2. Custom SMTP via SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM
 */

import nodemailer from "nodemailer";

/**
 * Creates and returns a configured Nodemailer transporter.
 */
function getTransporter(): { transporter: nodemailer.Transporter; senderEmail: string } | null {
  // Option 1: Custom SMTP (SendGrid, Mailgun, Amazon SES, Brevo, Namecheap Private Email, etc.)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
    const sender = process.env.EMAIL_FROM || process.env.SMTP_USER;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
    return { transporter, senderEmail: sender };
  }

  // Option 2: Gmail SMTP with Google App Password
  const emailFrom = process.env.EMAIL_FROM;
  const emailPass = process.env.EMAIL_APP_PASSWORD;

  const isConfiguredGmail =
    emailFrom &&
    emailPass &&
    !emailFrom.includes("your-gmail") &&
    !emailPass.includes("your-16-char");

  if (isConfiguredGmail) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailFrom,
        pass: emailPass,
      },
    });
    return { transporter, senderEmail: emailFrom };
  }

  return null;
}

export async function sendOtpEmail(params: {
  to: string;
  name: string;
  otp: string;
  purpose: "signup" | "reset";
}): Promise<{ success: boolean; error?: string }> {
  const { to, name, otp, purpose } = params;
  const isReset = purpose === "reset";

  const subject = isReset
    ? "Reset your Shaoor password"
    : "Verify your Shaoor account";

  const heading = isReset ? "Password Reset Code" : `Welcome, ${name}!`;
  const bodyText = isReset
    ? "Use the code below to reset your password. It expires in <strong>15 minutes</strong>."
    : "Use the verification code below to confirm your email address and activate your Shaoor account. It expires in <strong>15 minutes</strong>.";
  const footerText = isReset
    ? "If you did not request a password reset, you can safely ignore this email."
    : "If you did not create a Shaoor account, you can safely ignore this email.";

  const html = `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 32px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 28px;">
        <h1 style="font-size: 26px; font-weight: 800; color: #1e3a8a; margin: 0; letter-spacing: -0.5px;">Shaoor</h1>
        <p style="font-size: 13px; color: #6b7280; margin-top: 4px;">Academic Publishing Platform</p>
      </div>
      <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 8px;">${heading}</h2>
      <p style="color: #374151; line-height: 1.7; margin-bottom: 28px;">${bodyText}</p>
      <div style="background: #f3f4f6; border-radius: 14px; padding: 28px; text-align: center; margin-bottom: 28px; border: 1px solid #e5e7eb;">
        <div style="font-size: 44px; font-weight: 900; letter-spacing: 14px; color: #1e3a8a; font-family: 'Courier New', monospace;">${otp}</div>
      </div>
      <p style="font-size: 13px; color: #9ca3af; line-height: 1.6;">${footerText}</p>
      <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
      <p style="font-size: 12px; color: #d1d5db; text-align: center;">© ${new Date().getFullYear()} Shaoor Journal of Academic Research</p>
    </div>
  `;

  const config = getTransporter();

  if (!config) {
    console.warn(`\n[EMAIL DISPATCH NOTICE]`);
    console.warn(`No real SMTP credentials configured yet (EMAIL_FROM / EMAIL_APP_PASSWORD).`);
    console.warn(`Target recipient: ${to} | OTP: ${otp} | Purpose: ${purpose}\n`);
    // Return success to the API so client UI proceeds to OTP entry smoothly
    return { success: true };
  }

  try {
    await config.transporter.sendMail({
      from: `"Shaoor Platform" <${config.senderEmail}>`,
      to,
      subject,
      html,
    });

    console.log(`[EMAIL DISPATCH SUCCESS] Sent ${purpose} OTP to ${to}`);
    return { success: true };
  } catch (err: any) {
    console.error(`[EMAIL DISPATCH ERROR] Failed to send email to ${to}:`, err?.message || err);
    return { success: false, error: err?.message || "Failed to send email" };
  }
}
