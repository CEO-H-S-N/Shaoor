import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { sendOtpEmail } from "@/lib/email";

const Schema = z.object({ email: z.string().email("Please enter a valid email address.") });

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
    const parsed = Schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    const prisma = getPrisma();

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, emailVerified: true, isActive: true },
    });

    // Always return success to prevent email enumeration attacks
    if (!user || !user.isActive) {
      await prisma.$disconnect();
      // Still return success to avoid leaking which emails exist
      return NextResponse.json({
        success: true,
        message: "If an account with that email exists, a reset code has been sent.",
      });
    }

    // Invalidate any existing unused OTPs for this email
    await prisma.emailOtp.updateMany({
      where: { email, used: false },
      data: { used: true },
    });

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.emailOtp.create({ data: { email, otp, expiresAt } });
    await prisma.$disconnect();

    const { previewUrl } = await sendOtpEmail({
      to: email,
      name: user.name || "User",
      otp,
      purpose: "reset",
    });

    return NextResponse.json({
      success: true,
      message: "Password reset code sent to your email.",
      previewUrl, // Only populated in test/dev mode (Ethereal)
    });
  } catch (err) {
    console.error("[POST /api/auth/forgot-password]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
