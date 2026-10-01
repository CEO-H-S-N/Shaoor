import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ORCID_REGEX = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

const UpdateProfileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be under 100 characters"),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens")
    .optional()
    .nullable()
    .or(z.literal("")),
  image: z.string().trim().optional().nullable().or(z.literal("")),
  affiliation: z.string().trim().max(200, "Affiliation must be under 200 characters").optional().nullable().or(z.literal("")),
  bio: z.string().trim().max(2000, "Bio must be under 2000 characters").optional().nullable().or(z.literal("")),
  orcidId: z
    .string()
    .trim()
    .regex(ORCID_REGEX, "ORCID iD must follow the format 0000-0000-0000-0000")
    .optional()
    .nullable()
    .or(z.literal("")),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        image: true,
        role: true,
        affiliation: true,
        bio: true,
        orcidId: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            papers: true,
            reviews: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (err) {
    console.error("[GET /api/user/profile]", err);
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = UpdateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input data" },
        { status: 400 }
      );
    }

    const { name, username, image, affiliation, bio, orcidId } = parsed.data;
    const cleanUsername = username ? username.trim().toLowerCase() : null;
    const cleanOrcidId = orcidId ? orcidId.trim().toUpperCase() : null;
    const cleanAffiliation = affiliation ? affiliation.trim() : null;
    const cleanBio = bio ? bio.trim() : null;
    const cleanImage = image ? image.trim() : null;

    // Security & Header size guard: reject data URIs or oversized images to prevent HTTP 494
    if (cleanImage) {
      if (cleanImage.startsWith("data:") || cleanImage.length > 500) {
        return NextResponse.json(
          { error: "Direct image data embeds are not supported. Please upload an image file or choose an avatar preset." },
          { status: 400 }
        );
      }
    }

    // Check if username is taken by another user
    if (cleanUsername) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: cleanUsername,
          id: { not: session.user.id },
        },
        select: { id: true },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: `The username "${cleanUsername}" is already taken.` },
          { status: 409 }
        );
      }
    }

    // Check if ORCID iD is registered by another user
    if (cleanOrcidId) {
      const existingOrcid = await prisma.user.findFirst({
        where: {
          orcidId: cleanOrcidId,
          id: { not: session.user.id },
        },
        select: { id: true },
      });

      if (existingOrcid) {
        return NextResponse.json(
          { error: `The ORCID iD ${cleanOrcidId} is already linked to another account.` },
          { status: 409 }
        );
      }
    }

    // Perform atomic update
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        username: cleanUsername,
        image: cleanImage,
        affiliation: cleanAffiliation,
        bio: cleanBio,
        orcidId: cleanOrcidId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        image: true,
        role: true,
        affiliation: true,
        bio: true,
        orcidId: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            papers: true,
            reviews: true,
          },
        },
      },
    });

    // Audit log (OWASP A09)
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "PROFILE_UPDATED",
        resourceType: "user",
        resourceId: session.user.id,
        details: {
          fieldsUpdated: {
            name: !!name,
            username: !!cleanUsername,
            image: !!cleanImage,
            affiliation: !!cleanAffiliation,
            bio: !!cleanBio,
            orcidId: !!cleanOrcidId,
          },
        },
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err: any) {
    console.error("[PATCH /api/user/profile]", err);
    return NextResponse.json(
      { error: err?.message || "Failed to update profile. Please try again." },
      { status: 500 }
    );
  }
}
