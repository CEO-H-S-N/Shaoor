import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any)?.role;
    if (role !== "ADMIN" && role !== "DESIGNER") {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const resolved = await Promise.resolve(params);
    const targetUserId = resolved.id;

    // Fetch target user
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Safety: Protect master account from being banned
    if (targetUser.email === "shouket.tilwani@gmail.com") {
      return NextResponse.json(
        { error: "Action prohibited: The Platform Owner / Master Account cannot be suspended or banned." },
        { status: 403 }
      );
    }

    // Safety: Prevent self-ban
    if (targetUser.id === session.user.id || targetUser.email === session.user.email) {
      return NextResponse.json(
        { error: "Action prohibited: You cannot ban your own active administrator account." },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const reason = body?.reason?.trim() || (targetUser.isActive ? "Administrative suspension" : null);

    const willBeActive = !targetUser.isActive;

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        isActive: willBeActive,
        bannedAt: willBeActive ? null : new Date(),
        bannedReason: willBeActive ? null : reason,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        bannedAt: true,
        bannedReason: true,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: willBeActive ? "USER_UNBANNED" : "USER_TEMPORARILY_BANNED",
        resourceType: "User",
        resourceId: targetUser.id,
        details: {
          targetEmail: targetUser.email,
          newStatus: willBeActive ? "ACTIVE" : "BANNED",
          reason,
          executedBy: session.user.email,
        },
      },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: willBeActive
        ? `Account for ${targetUser.name || targetUser.email} has been reinstated and activated.`
        : `Account for ${targetUser.name || targetUser.email} has been temporarily suspended/banned.`,
      user: updated,
    });
  } catch (err: any) {
    console.error("[POST /api/admin/users/[id]/toggle-ban]", err);
    return NextResponse.json({ error: "Failed to update account status" }, { status: 500 });
  }
}
