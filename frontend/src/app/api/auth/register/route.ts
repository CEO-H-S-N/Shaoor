import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  institution: z.string().min(2, "Institution is required").optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

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

async function sendOtpEmail(email: string, otp: string, name: string) {
  const emailFrom = process.env.EMAIL_FROM;
  const emailPass = process.env.EMAIL_APP_PASSWORD;

  const isConfigured =
    emailFrom &&
    emailPass &&
    !emailFrom.includes("your-gmail") &&
    !emailPass.includes("your-16-char");

  if (!isConfigured) {
    console.log(`\n========================================`);
    console.log(`[DEV OTP SIMULATION - EMAIL NOT CONFIGURED]`);
    console.log(`To: ${email} (${name})`);
    console.log(`OTP Code: ${otp}`);
    console.log(`Configure EMAIL_FROM & EMAIL_APP_PASSWORD in .env.local to send real emails.`);
    console.log(`========================================\n`);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailFrom,
        pass: emailPass,
      },
    });

    await transporter.sendMail({
      from: `"Shaoor Platform" <${emailFrom}>`,
      to: email,
      subject: "Verify your Shaoor account",
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 24px; font-weight: 700; color: #18181b; margin: 0;">Shaoor</h1>
            <p style="font-size: 13px; color: #71717a; margin-top: 4px;">Academic Publishing Platform</p>
          </div>
          <h2 style="font-size: 20px; font-weight: 600; color: #111827; margin-bottom: 8px;">Welcome, ${name}!</h2>
          <p style="color: #374151; margin-bottom: 24px; line-height: 1.6;">
            Use the verification code below to confirm your email address and activate your Shaoor account. 
            This code expires in <strong>15 minutes</strong>.
          </p>
          <div style="background: #f4f4f5; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <div style="font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #18181b; font-family: monospace;">${otp}</div>
          </div>
          <p style="font-size: 13px; color: #9ca3af; line-height: 1.5;">
            If you did not create a Shaoor account, you can safely ignore this email.
          </p>
        </div>
      `,
    });
  } catch (smtpErr) {
    console.warn("[SMTP Warning] Could not send email via Gmail:", smtpErr);
    console.log(`\n========================================`);
    console.log(`[FALLBACK OTP CODE]`);
    console.log(`To: ${email}`);
    console.log(`OTP Code: ${otp}`);
    console.log(`========================================\n`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, username, institution, password } = parsed.data;
    const prisma = getPrisma();

    // Check for existing email or username
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
      select: { email: true, username: true },
    });

    if (existing) {
      await prisma.$disconnect();
      if (existing.email === email) {
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "This username is already taken." },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create unverified user
    await prisma.user.create({
      data: {
        name,
        email,
        username,
        affiliation: institution,
        passwordHash,
        emailVerified: null, // not verified yet
        isActive: false,     // activate after verification
      },
    });

    // Generate and store OTP
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Invalidate any previous OTPs for this email
    await prisma.emailOtp.updateMany({
      where: { email, used: false },
      data: { used: true },
    });

    await prisma.emailOtp.create({
      data: { email, otp, expiresAt },
    });

    await prisma.$disconnect();

    // Send OTP email
    await sendOtpEmail(email, otp, name);

    return NextResponse.json({ success: true, email });
  } catch (err) {
    console.error("[/api/auth/register]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
