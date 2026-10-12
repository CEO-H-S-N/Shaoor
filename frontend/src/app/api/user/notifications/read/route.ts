import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let notificationId: string | null = null;
    try {
      const body = await req.json();
      notificationId = body?.notificationId || null;
    } catch {
      // Body may be empty if marking all as read
    }

    if (notificationId) {
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId: session.user.id,
        },
        data: { read: true },
      });
    } else {
      await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          read: false,
        },
        data: { read: true },
      });
    }

    return NextResponse.json({ success: true, message: "Notifications marked as read" });
  } catch (err: any) {
    console.error("[POST /api/user/notifications/read]", err);
    return NextResponse.json({ error: "Failed to mark notifications as read" }, { status: 500 });
  }
}
