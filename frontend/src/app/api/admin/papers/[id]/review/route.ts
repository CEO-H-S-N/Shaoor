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
      return NextResponse.json({ error: "Forbidden. Admin privileges required." }, { status: 403 });
    }

    const resolved = await Promise.resolve(params);
    const paperId = resolved.id;

    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
      include: { author: true },
    });

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    const body = await req.json();
    const { action, reason } = body;

    if (action !== "APPROVE" && action !== "DENY") {
      return NextResponse.json({ error: "Invalid action. Must be APPROVE or DENY." }, { status: 400 });
    }

    if (action === "DENY" && (!reason || reason.trim().length < 5)) {
      return NextResponse.json(
        { error: "A detailed reason (at least 5 characters) is required when denying a manuscript." },
        { status: 400 }
      );
    }

    const reviewerName = session.user.name || session.user.email || "Editorial Reviewer";
    const decisionMessage =
      action === "APPROVE"
        ? reason?.trim() || "Your manuscript has been approved by the editorial review board."
        : reason.trim();

    const newStatus = action === "APPROVE" ? "ACCEPTED" : "REJECTED";

    // Update paper in database
    const updated = await prisma.paper.update({
      where: { id: paperId },
      data: {
        status: newStatus,
        decisionMessage,
        decisionBy: reviewerName,
        decisionAt: new Date(),
        ...(action === "APPROVE" && { publishedAt: new Date() }),
      },
    });

    // Send in-app notification to the paper author
    if (paper.authorId) {
      await prisma.notification.create({
        data: {
          userId: paper.authorId,
          type: action === "APPROVE" ? "PAPER_ACCEPTED" : "PAPER_REJECTED",
          title:
            action === "APPROVE"
              ? `Manuscript Accepted: "${paper.title}"`
              : `Editorial Decision: "${paper.title}"`,
          message:
            action === "APPROVE"
              ? `Congratulations! Your manuscript has been approved by ${reviewerName} and accepted for publication.`
              : `Your manuscript was not accepted in its current form. Reviewer Feedback: "${decisionMessage}". You may revise and submit for review again.`,
          metadata: {
            paperId: paper.id,
            action,
            reason: decisionMessage,
            decisionBy: reviewerName,
          },
        },
      }).catch((e) => console.error("[Notification Creation Error]", e));
    }

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: action === "APPROVE" ? "PAPER_APPROVED" : "PAPER_DENIED",
        resourceType: "Paper",
        resourceId: paper.id,
        details: {
          paperTitle: paper.title,
          action,
          reason: decisionMessage,
          reviewer: reviewerName,
        },
      },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message:
        action === "APPROVE"
          ? `Paper "${paper.title}" has been approved.`
          : `Paper "${paper.title}" has been denied. The author has been notified with your reason.`,
      paper: updated,
    });
  } catch (err: any) {
    console.error("[POST /api/admin/papers/[id]/review]", err);
    return NextResponse.json({ error: "Failed to process review decision" }, { status: 500 });
  }
}
