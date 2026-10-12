import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [rawNotifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          read: true,
          metadata: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({
        where: {
          userId: session.user.id,
          read: false,
        },
      }),
    ]);

    const notifications = rawNotifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      isRead: n.read,
      paperId: (n.metadata as any)?.paperId || null,
      createdAt: n.createdAt,
    }));

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (err: any) {
    console.error("[GET /api/user/notifications]", err);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}
