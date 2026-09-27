import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { sendOtpEmail } from "@/lib/email";

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
        emailVerified: null,
        isActive: false,
      },
    });

    // Generate and store OTP
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

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
    const { previewUrl } = await sendOtpEmail({ to: email, name, otp, purpose: "signup" });

    return NextResponse.json({ success: true, email, previewUrl });
  } catch (err) {
    console.error("[/api/auth/register]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
