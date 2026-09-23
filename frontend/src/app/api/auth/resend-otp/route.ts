import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import nodemailer from "nodemailer";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const ResendSchema = z.object({ email: z.string().email() });

function getPrisma() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ResendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email." }, { status: 400 });
    }

    const { email } = parsed.data;
    const prisma = getPrisma();

    const user = await prisma.user.findUnique({
      where: { email },
      select: { name: true, emailVerified: true },
    });

    if (!user) {
      await prisma.$disconnect();
      return NextResponse.json({ error: "No account found with this email." }, { status: 404 });
    }

    if (user.emailVerified) {
      await prisma.$disconnect();
      return NextResponse.json({ error: "This account is already verified." }, { status: 409 });
    }

    // Invalidate old OTPs
    await prisma.emailOtp.updateMany({
      where: { email, used: false },
      data: { used: true },
    });

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.emailOtp.create({ data: { email, otp, expiresAt } });
    await prisma.$disconnect();

    const emailFrom = process.env.EMAIL_FROM;
    const emailPass = process.env.EMAIL_APP_PASSWORD;
    const isConfigured =
      emailFrom &&
      emailPass &&
      !emailFrom.includes("your-gmail") &&
      !emailPass.includes("your-16-char");

    if (!isConfigured) {
      console.log(`\n========================================`);
      console.log(`[DEV OTP SIMULATION - RESEND]`);
      console.log(`To: ${email}`);
      console.log(`OTP Code: ${otp}`);
      console.log(`========================================\n`);
      return NextResponse.json({ success: true });
    }

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: emailFrom, pass: emailPass },
      });

      await transporter.sendMail({
        from: `"Shaoor Platform" <${emailFrom}>`,
        to: email,
        subject: "Your new Shaoor verification code",
        html: `
          <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
            <h2 style="color: #18181b;">New Verification Code</h2>
            <p style="color: #374151;">Here is your new code. It expires in 15 minutes.</p>
            <div style="background: #f4f4f5; border-radius: 12px; padding: 24px; text-align: center;">
              <div style="font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #18181b; font-family: monospace;">${otp}</div>
            </div>
          </div>
        `,
      });
    } catch (smtpErr) {
      console.warn("[SMTP Warning] Could not resend email via Gmail:", smtpErr);
      console.log(`\n========================================`);
      console.log(`[FALLBACK RESENT OTP CODE]`);
      console.log(`To: ${email}`);
      console.log(`OTP Code: ${otp}`);
      console.log(`========================================\n`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[/api/auth/resend-otp]", err);
    return NextResponse.json({ error: "Failed to resend code." }, { status: 500 });
  }
}
