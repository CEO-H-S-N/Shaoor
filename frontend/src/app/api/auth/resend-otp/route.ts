import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { sendOtpEmail } from "@/lib/email";

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

    await sendOtpEmail({
      to: email,
      name: user.name || "User",
      otp,
      purpose: "signup",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[/api/auth/resend-otp]", err);
    return NextResponse.json({ error: "Failed to resend code." }, { status: 500 });
  }
}
