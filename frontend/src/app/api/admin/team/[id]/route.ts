import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
        { error: "Forbidden. Platform owner privileges required." },
        { status: 403 }
      );
    }

    const resolved = await Promise.resolve(params);
    const memberId = resolved.id;

    const body = await req.json();
    const { name, designation, institution, summary, image, email, sortOrder, isActive } = body;

    const updated = await prisma.teamMember.update({
      where: { id: memberId },
      data: {
        ...(name && { name }),
        ...(designation && { designation }),
        ...(institution && { institution }),
        ...(summary && { summary }),
        ...(image !== undefined && { image }),
        ...(email !== undefined && { email }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `${updated.name} updated successfully.`,
      member: updated,
    });
  } catch (err: any) {
    console.error("[PUT /api/admin/team/[id]]", err);
    return NextResponse.json({ error: "Failed to update team member" }, { status: 500 });
  }
}

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
        { error: "Forbidden. Platform owner privileges required." },
        { status: 403 }
      );
    }

    const resolved = await Promise.resolve(params);
    const memberId = resolved.id;

    const deleted = await prisma.teamMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({
      success: true,
      message: `${deleted.name} removed from Our Team.`,
    });
  } catch (err: any) {
    console.error("[DELETE /api/admin/team/[id]]", err);
    return NextResponse.json({ error: "Failed to delete team member" }, { status: 500 });
  }
}
