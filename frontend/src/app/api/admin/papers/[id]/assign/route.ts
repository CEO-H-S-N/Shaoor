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

    const isMaster = !!(session.user as any)?.isMaster || session.user.email === "shouket.tilwani@gmail.com";
    if (!isMaster) {
      return NextResponse.json(
        { error: "Forbidden. Only the master admin can assign papers to reviewers." },
        { status: 403 }
      );
    }

    const resolved = await Promise.resolve(params);
    const paperId = resolved.id;

    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
      select: { id: true, title: true, assignedToId: true },
    });

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    const body = await req.json();
    const { assignToUserId } = body;

    let targetAdmin = null;
    if (assignToUserId) {
      targetAdmin = await prisma.user.findUnique({
        where: { id: assignToUserId },
        select: { id: true, name: true, email: true, role: true },
      });

      if (!targetAdmin) {
        return NextResponse.json({ error: "Target administrator not found." }, { status: 404 });
      }

      if (targetAdmin.role !== "ADMIN" && targetAdmin.role !== "DESIGNER") {
        return NextResponse.json(
          { error: "Papers can only be assigned to administrator accounts." },
          { status: 400 }
        );
      }
    }

    // Update paper assignment
    const updated = await prisma.paper.update({
      where: { id: paperId },
      data: {
        assignedToId: targetAdmin ? targetAdmin.id : null,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Notify assigned admin
    if (targetAdmin) {
      await prisma.notification.create({
        data: {
          userId: targetAdmin.id,
          type: "REVIEWER_ASSIGNED",
          title: "New Manuscript Assigned",
          message: `Master Admin has assigned manuscript "${paper.title}" to your editorial queue for review.`,
          metadata: { paperId: paper.id },
        },
      }).catch(() => null);
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "PAPER_ASSIGNED",
        resourceType: "Paper",
        resourceId: paper.id,
        details: {
          paperTitle: paper.title,
          assignedToId: targetAdmin?.id ?? null,
          assignedToName: targetAdmin?.name ?? "Unassigned",
          assignedBy: session.user.email,
        },
      },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: targetAdmin
        ? `Paper successfully assigned to ${targetAdmin.name || targetAdmin.email}.`
        : "Paper unassigned.",
      assignedTo: updated.assignedTo,
    });
  } catch (err: any) {
    console.error("[POST /api/admin/papers/[id]/assign]", err);
    return NextResponse.json({ error: "Failed to assign paper" }, { status: 500 });
  }
}
