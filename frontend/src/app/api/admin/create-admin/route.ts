import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createAdminSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters").max(100),
  email: z.string().email("Please provide a valid institutional email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  affiliation: z.string().max(200).optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any)?.role;
    if (role !== "ADMIN" && role !== "DESIGNER") {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const admins = await prisma.user.findMany({
      where: {
        role: "ADMIN",
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        affiliation: true,
        isActive: true,
        bannedAt: true,
        bannedReason: true,
        createdAt: true,
        _count: {
          select: {
            reviews: true,
            papers: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ admins });
  } catch (err: any) {
    console.error("[GET /api/admin/create-admin]", err);
    return NextResponse.json({ error: "Failed to fetch admin accounts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any)?.role;
    if (role !== "ADMIN" && role !== "DESIGNER") {
      return NextResponse.json({ error: "Forbidden. Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createAdminSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid admin data" },
        { status: 400 }
      );
    }

    const { name, email, password, affiliation } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      if (existing.role === "ADMIN") {
        return NextResponse.json(
          { error: "An administrator account with this email address already exists." },
          { status: 409 }
        );
      }

      // Promote existing user to ADMIN
      const updated = await prisma.user.update({
        where: { email: normalizedEmail },
        data: {
          role: "ADMIN",
          name: name || existing.name,
          affiliation: affiliation || existing.affiliation,
          isActive: true,
          passwordHash: await bcrypt.hash(password, 12),
          emailVerified: existing.emailVerified ?? new Date(),
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          affiliation: true,
          createdAt: true,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "ADMIN_PROMOTED",
          resourceType: "User",
          resourceId: updated.id,
          details: { promotedEmail: normalizedEmail, assignedBy: session.user.email },
        },
      }).catch(() => null);

      return NextResponse.json({
        success: true,
        message: "Existing user promoted to Administrator.",
        user: updated,
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create new admin user
    const newAdmin = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        affiliation: affiliation || null,
        role: "ADMIN",
        emailVerified: new Date(),
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        affiliation: true,
        createdAt: true,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ADMIN_CREATED",
        resourceType: "User",
        resourceId: newAdmin.id,
        details: { adminEmail: normalizedEmail, createdBy: session.user.email },
      },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: "Administrator account generated successfully.",
      user: newAdmin,
    });
  } catch (err: any) {
    console.error("[POST /api/admin/create-admin]", err);
    return NextResponse.json({ error: "Failed to generate administrator account" }, { status: 500 });
  }
}
