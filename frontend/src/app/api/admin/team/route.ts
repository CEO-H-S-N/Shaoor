import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const teamMemberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  designation: z.string().min(2, "Designation is required").max(100),
  institution: z.string().min(2, "Institution is required").max(150),
  summary: z.string().min(10, "Summary must be at least 10 characters").max(2000),
  image: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

export async function GET() {
  try {
    const members = await prisma.teamMember.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ members });
  } catch (err: any) {
    console.error("[GET /api/admin/team]", err);
    return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isMaster = !!(session.user as any)?.isMaster || session.user.email === "shouket.tilwani@gmail.com";
    if (!isMaster) {
      return NextResponse.json(
        { error: "Forbidden. Platform owner privileges required to modify editorial team." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = teamMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid member data" },
        { status: 400 }
      );
    }

    const count = await prisma.teamMember.count();

    const member = await prisma.teamMember.create({
      data: {
        name: parsed.data.name,
        designation: parsed.data.designation,
        institution: parsed.data.institution,
        summary: parsed.data.summary,
        image: parsed.data.image || null,
        email: parsed.data.email || null,
        sortOrder: parsed.data.sortOrder ?? count + 1,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "TEAM_MEMBER_CREATED",
        resourceType: "TeamMember",
        resourceId: member.id,
        details: { name: member.name, designation: member.designation, addedBy: session.user.email },
      },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: `${member.name} has been added to Our Team.`,
      member,
    });
  } catch (err: any) {
    console.error("[POST /api/admin/team]", err);
    return NextResponse.json({ error: "Failed to create team member" }, { status: 500 });
  }
}
