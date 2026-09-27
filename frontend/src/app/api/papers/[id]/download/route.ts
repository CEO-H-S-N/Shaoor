import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolved = await Promise.resolve(params);
    const id = resolved.id;

    const existing = await prisma.paper.findUnique({
      where: { id },
      select: { id: true, downloadCount: true },
    });

    if (!existing) {
      return NextResponse.json({ downloads: 1 });
    }

    const updated = await prisma.paper.update({
      where: { id },
      data: {
        downloadCount: { increment: 1 },
      },
      select: {
        downloadCount: true,
      },
    });

    return NextResponse.json({
      downloads: updated.downloadCount,
    });
  } catch (err: any) {
    console.error("[POST /api/papers/[id]/download]", err);
    return NextResponse.json({ error: "Failed to record download" }, { status: 500 });
  }
}
