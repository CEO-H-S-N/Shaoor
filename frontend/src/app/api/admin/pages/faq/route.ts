import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_FAQ_CONTENT, FaqPageData } from "@/lib/pageContentDefaults";

export async function GET() {
  try {
    const page = await prisma.pageContent.findUnique({
      where: { slug: "faq" },
    });

    if (!page) {
      return NextResponse.json({
        content: DEFAULT_FAQ_CONTENT,
        isDefault: true,
      });
    }

    let parsedContent: Partial<FaqPageData> = {};
    try {
      parsedContent = JSON.parse(page.content);
    } catch {
      parsedContent = {};
    }

    const content: FaqPageData = {
      title: page.title || DEFAULT_FAQ_CONTENT.title,
      subtitle: page.subtitle || DEFAULT_FAQ_CONTENT.subtitle,
      badge: parsedContent.badge || DEFAULT_FAQ_CONTENT.badge,
      contactHeading: parsedContent.contactHeading || DEFAULT_FAQ_CONTENT.contactHeading,
      contactDescription: parsedContent.contactDescription || DEFAULT_FAQ_CONTENT.contactDescription,
      contactEmail: parsedContent.contactEmail || DEFAULT_FAQ_CONTENT.contactEmail,
      items: Array.isArray(parsedContent.items) && parsedContent.items.length > 0
        ? parsedContent.items
        : DEFAULT_FAQ_CONTENT.items,
    };

    return NextResponse.json({
      content,
      updatedAt: page.updatedAt,
      updatedBy: page.updatedBy,
      isDefault: false,
    });
  } catch (err: any) {
    console.error("[GET /api/admin/pages/faq]", err);
    return NextResponse.json({ error: "Failed to load FAQ content" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isMaster =
      !!(session.user as any)?.isMaster ||
      session.user.email === "shouket.tilwani@gmail.com";

    if (!isMaster) {
      return NextResponse.json(
        { error: "Forbidden. Platform owner privileges required to modify FAQ content." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      subtitle,
      badge,
      contactHeading,
      contactDescription,
      contactEmail,
      items,
    } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "At least one FAQ item is required" }, { status: 400 });
    }

    const contentJson = JSON.stringify({
      badge: badge || DEFAULT_FAQ_CONTENT.badge,
      contactHeading: contactHeading || DEFAULT_FAQ_CONTENT.contactHeading,
      contactDescription: contactDescription || DEFAULT_FAQ_CONTENT.contactDescription,
      contactEmail: contactEmail || DEFAULT_FAQ_CONTENT.contactEmail,
      items,
    });

    const updated = await prisma.pageContent.upsert({
      where: { slug: "faq" },
      update: {
        title: title.trim(),
        subtitle: subtitle?.trim() || "",
        content: contentJson,
        updatedBy: session.user.email,
      },
      create: {
        slug: "faq",
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
        details: { slug: "faq", title: updated.title, updatedBy: session.user.email, itemCount: items.length },
      },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: "FAQ page content updated successfully.",
    });
  } catch (err: any) {
    console.error("[POST /api/admin/pages/faq]", err);
    return NextResponse.json({ error: "Failed to update FAQ content" }, { status: 500 });
  }
}
