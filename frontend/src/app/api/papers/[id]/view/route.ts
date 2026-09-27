import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolved = await Promise.resolve(params);
    const id = resolved.id;

    // Check if paper exists in DB
    const existing = await prisma.paper.findUnique({
      where: { id },
      select: { id: true, viewCount: true, downloadCount: true },
    });

    if (!existing) {
      // Demo fallback papers (e.g. p1, p2)
      return NextResponse.json({ views: 1, downloads: 0 });
    }

    const updated = await prisma.paper.update({
      where: { id },
      data: {
        viewCount: { increment: 1 },
      },
      select: {
        viewCount: true,
        downloadCount: true,
      },
    });

    return NextResponse.json({
      views: updated.viewCount,
      downloads: updated.downloadCount,
    });
  } catch (err: any) {
    console.error("[POST /api/papers/[id]/view]", err);
    return NextResponse.json({ error: "Failed to record view" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolved = await Promise.resolve(params);
    const id = resolved.id;

    const paper = await prisma.paper.findUnique({
      where: { id },
      select: { viewCount: true, downloadCount: true },
    });

    if (!paper) {
      return NextResponse.json({ views: 0, downloads: 0 });
    }

    return NextResponse.json({
      views: paper.viewCount,
      downloads: paper.downloadCount,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch counts" }, { status: 500 });
  }
}
