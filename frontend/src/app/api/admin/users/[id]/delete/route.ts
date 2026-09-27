import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
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
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        _count: {
          select: {
            papers: true,
            reviews: true,
          },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Safety: Protect master account from deletion
    if (targetUser.email === "shouket.tilwani@gmail.com") {
      return NextResponse.json(
        { error: "Action prohibited: The Platform Owner / Master Account cannot be deleted." },
        { status: 403 }
      );
    }

    // Safety: Prevent self-deletion
    if (targetUser.id === session.user.id || targetUser.email === session.user.email) {
      return NextResponse.json(
        { error: "Action prohibited: You cannot delete your own active administrator account." },
        { status: 400 }
      );
    }

    // Perform atomic cleanup and deletion
    await prisma.$transaction(async (tx) => {
      // 1. Delete associated notifications
      await tx.notification.deleteMany({
        where: { userId: targetUserId },
      });

      // 2. Delete user sessions & accounts
      await tx.session.deleteMany({
        where: { userId: targetUserId },
      });
      await tx.account.deleteMany({
        where: { userId: targetUserId },
      });

      // 3. Delete reviews written by this user
      await tx.review.deleteMany({
        where: { reviewerId: targetUserId },
      });

      // 4. Delete papers authored by this user (including figures cascade)
      const userPapers = await tx.paper.findMany({
        where: { authorId: targetUserId },
        select: { id: true },
      });

      if (userPapers.length > 0) {
        const paperIds = userPapers.map((p) => p.id);
        await tx.paperFigure.deleteMany({
          where: { paperId: { in: paperIds } },
        });
        await tx.review.deleteMany({
          where: { paperId: { in: paperIds } },
        });
        await tx.paper.deleteMany({
          where: { id: { in: paperIds } },
        });
      }

      // 5. Delete user record
      await tx.user.delete({
        where: { id: targetUserId },
      });
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "USER_DELETED",
        resourceType: "User",
        resourceId: targetUserId,
        details: {
          deletedEmail: targetUser.email,
          deletedName: targetUser.name,
          executedBy: session.user.email,
        },
      },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: `Account ${targetUser.email} has been permanently deleted from the platform.`,
    });
  } catch (err: any) {
    console.error("[DELETE /api/admin/users/[id]/delete]", err);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
