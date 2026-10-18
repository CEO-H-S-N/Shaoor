import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET single journal
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolved = await Promise.resolve(params);
    const journalId = resolved.id;

    const journal = await prisma.journal.findUnique({
      where: { id: journalId },
      include: {
        entries: {
          orderBy: { sortOrder: "asc" },
          include: {
            paper: {
              include: {
                author: { select: { name: true, email: true, affiliation: true } },
                category: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!journal) {
      return NextResponse.json({ error: "Journal not found" }, { status: 404 });
    }

    return NextResponse.json({ journal });
  } catch (err: any) {
    console.error("[GET /api/admin/journals/[id]]", err);
    return NextResponse.json({ error: "Failed to fetch journal" }, { status: 500 });
  }
}

// PUT — update journal metadata (Master Admin only)
export async function PUT(
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
        { error: "Forbidden. Platform owner privileges required to edit journals." },
        { status: 403 }
      );
    }

    const resolved = await Promise.resolve(params);
    const journalId = resolved.id;

    const body = await req.json();
    const { title, slug, description, volume, issue, coverImage, publishedAt, isActive } = body;

    const updateData: any = {};
    if (title) updateData.title = title.trim();
    if (slug) {
      updateData.slug = slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    }
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (volume !== undefined) updateData.volume = parseInt(volume, 10);
    if (issue !== undefined) updateData.issue = parseInt(issue, 10);
    if (coverImage !== undefined) updateData.coverImage = coverImage ? coverImage.trim() : null;
    if (publishedAt) updateData.publishedAt = new Date(publishedAt);
    if (isActive !== undefined) updateData.isActive = !!isActive;

    const updated = await prisma.journal.update({
      where: { id: journalId },
      data: updateData,
    });

    if (Array.isArray(body.paperIds)) {
      await prisma.journalEntry.deleteMany({
        where: {
          journalId,
          paperId: { notIn: body.paperIds },
        },
      });

      const existingEntries = await prisma.journalEntry.findMany({
        where: { journalId },
        select: { paperId: true },
      });
      const existingIds = new Set(existingEntries.map((e) => e.paperId));
      const toAdd = body.paperIds.filter((pid: string) => !existingIds.has(pid));

      if (toAdd.length > 0) {
        await prisma.journalEntry.createMany({
          data: toAdd.map((pid: string, idx: number) => ({
            journalId,
            paperId: pid,
            sortOrder: existingIds.size + idx,
          })),
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Journal updated successfully.",
      journal: updated,
    });
  } catch (err: any) {
    console.error("[PUT /api/admin/journals/[id]]", err);
    return NextResponse.json({ error: "Failed to update journal" }, { status: 500 });
  }
}

// DELETE — delete journal (Master Admin only)
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
        { error: "Forbidden. Platform owner privileges required to delete journals." },
        { status: 403 }
      );
    }

    const resolved = await Promise.resolve(params);
    const journalId = resolved.id;

    await prisma.journal.delete({
      where: { id: journalId },
    });

    return NextResponse.json({
      success: true,
      message: "Journal deleted successfully.",
    });
  } catch (err: any) {
    console.error("[DELETE /api/admin/journals/[id]]", err);
    return NextResponse.json({ error: "Failed to delete journal" }, { status: 500 });
  }
}
