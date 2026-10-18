import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — List all journals (can be called by authenticated admins or public)
export async function GET(req: NextRequest) {
  try {
    const journals = await prisma.journal.findMany({
      orderBy: [{ volume: "desc" }, { issue: "desc" }],
      include: {
        _count: {
          select: { entries: true },
        },
      },
    });

    return NextResponse.json({ journals });
  } catch (err: any) {
    console.error("[GET /api/admin/journals]", err);
    return NextResponse.json({ error: "Failed to fetch journals" }, { status: 500 });
  }
}

// POST — Create a new journal volume/issue (Master Admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isMaster = !!(session.user as any)?.isMaster || session.user.email === "shouket.tilwani@gmail.com";
    if (!isMaster) {
      return NextResponse.json(
        { error: "Forbidden. Platform owner privileges required to create journals." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, slug, description, volume, issue, coverImage, publishedAt, isActive } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Journal title is required." },
        { status: 400 }
      );
    }

    const volNum = volume !== undefined ? Math.max(1, parseInt(volume, 10) || 1) : 1;
    const issueNum = issue !== undefined ? Math.max(1, parseInt(issue, 10) || 1) : 1;

    // Generate or clean slug
    let journalSlug = (slug || title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check if slug is taken
    const existingSlug = await prisma.journal.findFirst({
      where: { slug: journalSlug },
    });
    if (existingSlug) {
      journalSlug = `${journalSlug}-${Date.now().toString().slice(-4)}`;
    }

    const pubDate = publishedAt ? new Date(publishedAt) : new Date();

    const journal = await prisma.journal.create({
      data: {
        title: title.trim(),
        slug: journalSlug,
        description: description?.trim() || null,
        volume: volNum,
        issue: issueNum,
        coverImage: coverImage?.trim() || null,
        publishedAt: pubDate,
        isActive: isActive !== undefined ? !!isActive : true,
      },
    });

    // If paperIds provided, assign them to this journal
    if (Array.isArray(body.paperIds) && body.paperIds.length > 0) {
      await prisma.journalEntry.createMany({
        data: body.paperIds.map((pid: string, idx: number) => ({
          journalId: journal.id,
          paperId: pid,
          sortOrder: idx,
        })),
        skipDuplicates: true,
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "JOURNAL_CREATED",
        resourceType: "Journal",
        resourceId: journal.id,
        details: {
          title: journal.title,
          volume: journal.volume,
          issue: journal.issue,
          createdBy: session.user.email,
        },
      },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: `Journal Volume ${journal.volume}, Issue ${journal.issue} created successfully.`,
      journal,
    });
  } catch (err: any) {
    console.error("[POST /api/admin/journals]", err);
    return NextResponse.json({ error: "Failed to create journal" }, { status: 500 });
  }
}
