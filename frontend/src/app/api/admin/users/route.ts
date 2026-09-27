import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any)?.role;
    if (role !== "ADMIN" && role !== "DESIGNER") {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const url = new URL(req.url);
    const search = url.searchParams.get("search")?.toLowerCase().trim() || "";
    const filterRole = url.searchParams.get("role") || "";
    const filterStatus = url.searchParams.get("status") || "";

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
        { affiliation: { contains: search, mode: "insensitive" } },
      ];
    }

    if (filterRole && ["CUSTOMER", "ADMIN", "DESIGNER"].includes(filterRole)) {
      where.role = filterRole;
    }

    if (filterStatus === "active") {
      where.isActive = true;
    } else if (filterStatus === "banned") {
      where.isActive = false;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        username: true,
        affiliation: true,
        isActive: true,
        bannedAt: true,
        bannedReason: true,
        createdAt: true,
        _count: {
          select: {
            papers: true,
            reviews: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalCount = await prisma.user.count();
    const activeCount = await prisma.user.count({ where: { isActive: true } });
    const bannedCount = await prisma.user.count({ where: { isActive: false } });
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });

    return NextResponse.json({
      users,
      stats: {
        total: totalCount,
        active: activeCount,
        banned: bannedCount,
        admins: adminCount,
      },
    });
  } catch (err: any) {
    console.error("[GET /api/admin/users]", err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
