import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET entries of a journal
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolved = await Promise.resolve(params);
    const journalId = resolved.id;

    const entries = await prisma.journalEntry.findMany({
      where: { journalId },
      orderBy: { sortOrder: "asc" },
      include: {
        paper: {
          select: {
            id: true,
            title: true,
            abstract: true,
            fileUrl: true,
            version: true,
            author: { select: { name: true, email: true, affiliation: true } },
            category: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json({ entries });
  } catch (err: any) {
    console.error("[GET /api/admin/journals/[id]/entries]", err);
    return NextResponse.json({ error: "Failed to fetch journal entries" }, { status: 500 });
  }
}

// POST — Add paper to journal (Master Admin only)
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
        { error: "Forbidden. Platform owner privileges required to add papers to journals." },
        { status: 403 }
      );
    }

    const resolved = await Promise.resolve(params);
    const journalId = resolved.id;

    const journal = await prisma.journal.findUnique({
      where: { id: journalId },
    });

    if (!journal) {
      return NextResponse.json({ error: "Journal not found" }, { status: 404 });
    }

    const body = await req.json();
    const { paperId, pageStart, pageEnd } = body;

    if (!paperId) {
      return NextResponse.json({ error: "Paper ID is required" }, { status: 400 });
    }

    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
      select: { id: true, title: true, status: true, authorId: true },
    });

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    // Check if already in this journal
    const existingEntry = await prisma.journalEntry.findUnique({
      where: {
        journalId_paperId: {
          journalId,
          paperId,
        },
      },
    });

    if (existingEntry) {
      return NextResponse.json(
        { error: "This paper is already included in this journal volume/issue." },
        { status: 409 }
      );
    }

    // Get highest sortOrder
    const lastEntry = await prisma.journalEntry.findFirst({
      where: { journalId },
      orderBy: { sortOrder: "desc" },
    });

    const nextOrder = (lastEntry?.sortOrder ?? 0) + 1;

    const entry = await prisma.journalEntry.create({
      data: {
        journalId,
        paperId,
        pageStart: pageStart ? parseInt(pageStart, 10) : null,
        pageEnd: pageEnd ? parseInt(pageEnd, 10) : null,
        sortOrder: nextOrder,
      },
      include: {
        paper: {
          select: {
            id: true,
            title: true,
            author: { select: { name: true, email: true } },
          },
        },
      },
    });

    // Notify author that paper has been published into Journal
    await prisma.notification.create({
      data: {
        userId: paper.authorId,
        type: "PAPER_PUBLISHED",
        title: "Paper Published in Journal Issue",
        message: `Congratulations! Your paper "${paper.title}" has been published in Shaoor Volume ${journal.volume}, Issue ${journal.issue}.`,
        metadata: { paperId: paper.id },
      },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: `Paper "${paper.title}" successfully added to Volume ${journal.volume}, Issue ${journal.issue}.`,
      entry,
    });
  } catch (err: any) {
    console.error("[POST /api/admin/journals/[id]/entries]", err);
    return NextResponse.json({ error: "Failed to add paper to journal" }, { status: 500 });
  }
}

// DELETE — Remove paper from journal (Master Admin only)
export async function DELETE(
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
        { error: "Forbidden. Platform owner privileges required to modify journals." },
        { status: 403 }
      );
    }

    const resolved = await Promise.resolve(params);
    const journalId = resolved.id;

    const body = await req.json();
    const { paperId, entryId } = body;

    if (entryId) {
      await prisma.journalEntry.delete({
        where: { id: entryId },
      });
    } else if (paperId) {
      await prisma.journalEntry.delete({
        where: {
          journalId_paperId: {
            journalId,
            paperId,
          },
        },
      });
    } else {
      return NextResponse.json({ error: "Entry ID or Paper ID is required" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Paper removed from journal.",
    });
  } catch (err: any) {
    console.error("[DELETE /api/admin/journals/[id]/entries]", err);
    return NextResponse.json({ error: "Failed to remove paper from journal" }, { status: 500 });
  }
}
