import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — fetch the current active announcement (public)
export async function GET() {
  try {
    const announcement = await prisma.announcement.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ announcement });
  } catch (err: any) {
    console.error("[GET /api/admin/announcement]", err);
    return NextResponse.json({ announcement: null });
  }
}

// POST — create or update the announcement (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any)?.role;
    if (role !== "ADMIN" && role !== "DESIGNER") {
      return NextResponse.json({ error: "Forbidden. Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const { title, message, imageUrl, linkUrl, linkLabel, isActive, showPopup } = body;

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required." }, { status: 400 });
    }

    // Upsert: find the first announcement or create a new one
    const existing = await prisma.announcement.findFirst({
      orderBy: { updatedAt: "desc" },
    });

    let announcement;
    if (existing) {
      announcement = await prisma.announcement.update({
        where: { id: existing.id },
        data: {
          title: title.trim(),
          message: message.trim(),
          imageUrl: imageUrl?.trim() || null,
          linkUrl: linkUrl?.trim() || null,
          linkLabel: linkLabel?.trim() || null,
          isActive: !!isActive,
          showPopup: !!showPopup,
          updatedBy: session.user.name || session.user.email || "Admin",
        },
      });
    } else {
      announcement = await prisma.announcement.create({
        data: {
          title: title.trim(),
          message: message.trim(),
          imageUrl: imageUrl?.trim() || null,
          linkUrl: linkUrl?.trim() || null,
          linkLabel: linkLabel?.trim() || null,
          isActive: !!isActive,
          showPopup: !!showPopup,
          updatedBy: session.user.name || session.user.email || "Admin",
        },
      });
    }

    return NextResponse.json({ success: true, announcement });
  } catch (err: any) {
    console.error("[POST /api/admin/announcement]", err);
    return NextResponse.json({ error: "Failed to save announcement" }, { status: 500 });
  }
}
