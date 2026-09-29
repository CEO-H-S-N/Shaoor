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
      return NextResponse.json({ error: "Forbidden. Admin privileges required." }, { status: 403 });
    }

    const resolved = await Promise.resolve(params);
    const paperId = resolved.id;

    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
      select: { id: true, title: true, authorId: true },
    });

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    // Delete all related records first (cascading), then the paper
    await prisma.paper.delete({
      where: { id: paperId },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "PAPER_DELETED",
        resourceType: "Paper",
        resourceId: paper.id,
        details: {
          paperTitle: paper.title,
          deletedBy: session.user.name || session.user.email || "Admin",
        },
      },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: `Paper "${paper.title}" has been permanently deleted.`,
    });
  } catch (err: any) {
    console.error("[DELETE /api/admin/papers/[id]/delete]", err);
    return NextResponse.json({ error: "Failed to delete paper" }, { status: 500 });
  }
}
