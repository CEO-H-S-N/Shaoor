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
    const { title, description, volume, issue, coverImage, publishedAt, isActive } = body;

    if (!title || volume === undefined || issue === undefined) {
      return NextResponse.json(
        { error: "Title, Volume, and Issue are required." },
        { status: 400 }
      );
    }

    const volNum = parseInt(volume, 10);
    const issueNum = parseInt(issue, 10);

    if (isNaN(volNum) || isNaN(issueNum) || volNum < 1 || issueNum < 1) {
      return NextResponse.json(
        { error: "Volume and Issue must be positive integers." },
        { status: 400 }
      );
    }

    // Check if volume/issue already exists
    const existing = await prisma.journal.findUnique({
      where: {
        volume_issue: {
          volume: volNum,
          issue: issueNum,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Journal Volume ${volNum}, Issue ${issueNum} already exists.` },
        { status: 409 }
      );
    }

    const pubDate = publishedAt ? new Date(publishedAt) : new Date();

    const journal = await prisma.journal.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        volume: volNum,
        issue: issueNum,
        coverImage: coverImage?.trim() || null,
        publishedAt: pubDate,
        isActive: isActive !== undefined ? !!isActive : true,
      },
    });

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
