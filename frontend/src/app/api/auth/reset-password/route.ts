import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const Schema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, "OTP must be 6 digits"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

function getPrisma() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
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

    const { email, otp, newPassword } = parsed.data;
    const prisma = getPrisma();

    // Find the most recent unused, unexpired OTP
    const record = await prisma.emailOtp.findFirst({
      where: { email, otp, used: false },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      await prisma.$disconnect();
      return NextResponse.json(
        { error: "Invalid or expired reset code. Please request a new one." },
        { status: 400 }
      );
    }

    if (record.expiresAt < new Date()) {
      await prisma.$disconnect();
      return NextResponse.json(
        { error: "This reset code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Atomically: mark OTP used + update password
    await prisma.$transaction([
      prisma.emailOtp.update({
        where: { id: record.id },
        data: { used: true },
      }),
      prisma.user.update({
        where: { email },
        data: {
          passwordHash,
          // Also ensure account is active (in case it wasn't yet verified)
          emailVerified: new Date(),
          isActive: true,
        },
      }),
    ]);

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully. You can now sign in.",
    });
  } catch (err) {
    console.error("[POST /api/auth/reset-password]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
