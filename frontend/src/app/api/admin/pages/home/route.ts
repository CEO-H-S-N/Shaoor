import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { DEFAULT_HOMEPAGE_CONTENT } from "@/lib/pageContentDefaults";
export { DEFAULT_HOMEPAGE_CONTENT };

export async function GET() {
  try {
    const page = await prisma.pageContent.findUnique({
      where: { slug: "homepage" },
    });

    if (!page) {
      return NextResponse.json({
        content: DEFAULT_HOMEPAGE_CONTENT,
        isDefault: true,
      });
    }

    let parsedContent: any = {};
    try {
      parsedContent = JSON.parse(page.content);
    } catch {
      parsedContent = { description: page.content };
    }

    return NextResponse.json({
      content: {
        title: page.title || DEFAULT_HOMEPAGE_CONTENT.title,
        subtitle: page.subtitle || DEFAULT_HOMEPAGE_CONTENT.subtitle,
        description: parsedContent.description || DEFAULT_HOMEPAGE_CONTENT.description,
      },
      updatedAt: page.updatedAt,
      updatedBy: page.updatedBy,
      isDefault: false,
    });
  } catch (err: any) {
    console.error("[GET /api/admin/pages/home]", err);
    return NextResponse.json({ error: "Failed to load homepage content" }, { status: 500 });
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
        { error: "Forbidden. Platform owner privileges required to modify homepage content." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, subtitle, description } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const contentJson = JSON.stringify({
      description: description || DEFAULT_HOMEPAGE_CONTENT.description,
    });

    const updated = await prisma.pageContent.upsert({
      where: { slug: "homepage" },
      update: {
        title: title.trim(),
        subtitle: subtitle?.trim() || "",
        content: contentJson,
        updatedBy: session.user.email,
      },
      create: {
        slug: "homepage",
        title: title.trim(),
        subtitle: subtitle?.trim() || "",
        content: contentJson,
        updatedBy: session.user.email,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "PAGE_CONTENT_UPDATED",
        resourceType: "PageContent",
        resourceId: updated.id,
        details: { slug: "homepage", title: updated.title, updatedBy: session.user.email },
      },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: "Homepage content updated successfully.",
      content: {
        title: updated.title,
        subtitle: updated.subtitle,
        description,
      },
    });
  } catch (err: any) {
    console.error("[POST /api/admin/pages/home]", err);
    return NextResponse.json({ error: "Failed to update homepage content" }, { status: 500 });
  }
}
