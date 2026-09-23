import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const VerifySchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
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
    const parsed = VerifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const { email, otp } = parsed.data;
    const prisma = getPrisma();

    // Find the most recent unused OTP for this email
    const record = await prisma.emailOtp.findFirst({
      where: { email, otp, used: false },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      await prisma.$disconnect();
      return NextResponse.json(
        { error: "Invalid verification code. Please check the code and try again." },
        { status: 400 }
      );
    }

    if (record.expiresAt < new Date()) {
      await prisma.$disconnect();
      return NextResponse.json(
        { error: "This verification code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Mark OTP as used and activate the user
    await Promise.all([
      prisma.emailOtp.update({
        where: { id: record.id },
        data: { used: true },
      }),
      prisma.user.update({
        where: { email },
        data: { emailVerified: new Date(), isActive: true },
      }),
    ]);

    await prisma.$disconnect();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[/api/auth/verify-otp]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
