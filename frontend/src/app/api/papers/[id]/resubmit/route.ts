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

    const resolved = await Promise.resolve(params);
    const paperId = resolved.id;

    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
    });

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    const isAuthor = paper.authorId === session.user.id;
    const role = (session.user as any)?.role;
    const isAdmin = role === "ADMIN" || role === "DESIGNER";

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden. Only the manuscript author can resubmit this paper." },
        { status: 403 }
      );
    }

    // Update status to SUBMITTED
    const updated = await prisma.paper.update({
      where: { id: paperId },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        version: { increment: 1 },
      },
    });

    // Notify author of successful resubmission
    await prisma.notification.create({
      data: {
        userId: paper.authorId,
        type: "PAPER_SUBMITTED",
        title: `Manuscript Resubmitted: "${paper.title}"`,
        message:
          "Your revised manuscript has been resubmitted for peer review and queued for editorial evaluation.",
        metadata: { paperId: paper.id, version: updated.version },
      },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: `Manuscript "${paper.title}" has been resubmitted for peer review!`,
      paper: updated,
    });
  } catch (err: any) {
    console.error("[POST /api/papers/[id]/resubmit]", err);
    return NextResponse.json({ error: "Failed to resubmit manuscript" }, { status: 500 });
  }
}
