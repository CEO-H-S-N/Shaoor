/**
 * Shaoor Email Utility
 *
 * Sends emails via Gmail SMTP if configured, otherwise falls back to
 * Ethereal (https://ethereal.email) — a real test inbox for dev/testing.
 * The preview URL is logged so you can click it and read the email.
 */

import nodemailer from "nodemailer";

/** Returns a reusable transporter + a flag indicating test mode */
async function getTransporter(): Promise<{
  transporter: nodemailer.Transporter;
  testMode: boolean;
  testUser?: string;
}> {
  const emailFrom = process.env.EMAIL_FROM;
  const emailPass = process.env.EMAIL_APP_PASSWORD;
  const isRealGmail =
    emailFrom &&
    emailPass &&
    !emailFrom.includes("your-gmail") &&
    !emailPass.includes("your-16-char");

  if (isRealGmail) {
    return {
      transporter: nodemailer.createTransport({
        service: "gmail",
        auth: { user: emailFrom, pass: emailPass },
      }),
      testMode: false,
    };
  }

  // Ethereal fallback — auto-creates a real temporary test account
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  return { transporter, testMode: true, testUser: testAccount.user };
}

export async function sendOtpEmail(params: {
  to: string;
  name: string;
  otp: string;
  purpose: "signup" | "reset";
}): Promise<{ previewUrl?: string }> {
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

  const { transporter, testMode, testUser } = await getTransporter();

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM
        ? `"Shaoor Platform" <${process.env.EMAIL_FROM}>`
        : `"Shaoor Platform" <${testUser}>`,
      to,
      subject,
      html,
    });

    if (testMode) {
      const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
      console.log(`\n${"=".repeat(60)}`);
      console.log(`[ETHEREAL TEST EMAIL — ${purpose.toUpperCase()}]`);
      console.log(`To: ${to}  |  OTP: ${otp}`);
      console.log(`Preview URL: ${previewUrl}`);
      console.log(`${"=".repeat(60)}\n`);
      return { previewUrl: previewUrl as string | undefined };
    }

    return {};
  } catch (err) {
    // Last-resort console fallback
    console.log(`\n${"=".repeat(50)}`);
    console.log(`[FALLBACK OTP — email send failed]`);
    console.log(`To: ${to}  |  OTP: ${otp}`);
    console.log(`${"=".repeat(50)}\n`);
    console.error(err);
    return {};
  }
}
