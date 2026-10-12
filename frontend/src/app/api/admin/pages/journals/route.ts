import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { DEFAULT_JOURNALS_PAGE_CONTENT } from "@/lib/pageContentDefaults";
export { DEFAULT_JOURNALS_PAGE_CONTENT };

export async function GET() {
  try {
    const page = await prisma.pageContent.findUnique({
      where: { slug: "journals" },
    });

    if (!page) {
      return NextResponse.json({
        content: DEFAULT_JOURNALS_PAGE_CONTENT,
        isDefault: true,
      });
    }

    let parsedContent: any = {};
    try {
      parsedContent = JSON.parse(page.content);
    } catch {
      parsedContent = {};
    }

    return NextResponse.json({
      content: {
        title: page.title || DEFAULT_JOURNALS_PAGE_CONTENT.title,
        subtitle: page.subtitle || DEFAULT_JOURNALS_PAGE_CONTENT.subtitle,
        badge: parsedContent.badge || DEFAULT_JOURNALS_PAGE_CONTENT.badge,
        metric1Label: parsedContent.metric1Label || DEFAULT_JOURNALS_PAGE_CONTENT.metric1Label,
        metric1Value: parsedContent.metric1Value || DEFAULT_JOURNALS_PAGE_CONTENT.metric1Value,
        metric2Label: parsedContent.metric2Label || DEFAULT_JOURNALS_PAGE_CONTENT.metric2Label,
        metric2Value: parsedContent.metric2Value || DEFAULT_JOURNALS_PAGE_CONTENT.metric2Value,
        metric3Label: parsedContent.metric3Label || DEFAULT_JOURNALS_PAGE_CONTENT.metric3Label,
        metric3Value: parsedContent.metric3Value || DEFAULT_JOURNALS_PAGE_CONTENT.metric3Value,
        archiveHeading: parsedContent.archiveHeading || DEFAULT_JOURNALS_PAGE_CONTENT.archiveHeading,
        archiveSubheading: parsedContent.archiveSubheading || DEFAULT_JOURNALS_PAGE_CONTENT.archiveSubheading,
        emptyStateTitle: parsedContent.emptyStateTitle || DEFAULT_JOURNALS_PAGE_CONTENT.emptyStateTitle,
        emptyStateMessage: parsedContent.emptyStateMessage || DEFAULT_JOURNALS_PAGE_CONTENT.emptyStateMessage,
      },
      updatedAt: page.updatedAt,
      updatedBy: page.updatedBy,
      isDefault: false,
    });
  } catch (err: any) {
    console.error("[GET /api/admin/pages/journals]", err);
    return NextResponse.json({ error: "Failed to load journals page content" }, { status: 500 });
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
        { error: "Forbidden. Platform owner privileges required to modify journals page content." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      subtitle,
      badge,
      metric1Label,
      metric1Value,
      metric2Label,
      metric2Value,
      metric3Label,
      metric3Value,
      archiveHeading,
      archiveSubheading,
      emptyStateTitle,
      emptyStateMessage,
    } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const contentJson = JSON.stringify({
      badge: badge || DEFAULT_JOURNALS_PAGE_CONTENT.badge,
      metric1Label: metric1Label || DEFAULT_JOURNALS_PAGE_CONTENT.metric1Label,
      metric1Value: metric1Value || DEFAULT_JOURNALS_PAGE_CONTENT.metric1Value,
      metric2Label: metric2Label || DEFAULT_JOURNALS_PAGE_CONTENT.metric2Label,
      metric2Value: metric2Value || DEFAULT_JOURNALS_PAGE_CONTENT.metric2Value,
      metric3Label: metric3Label || DEFAULT_JOURNALS_PAGE_CONTENT.metric3Label,
      metric3Value: metric3Value || DEFAULT_JOURNALS_PAGE_CONTENT.metric3Value,
      archiveHeading: archiveHeading || DEFAULT_JOURNALS_PAGE_CONTENT.archiveHeading,
      archiveSubheading: archiveSubheading || DEFAULT_JOURNALS_PAGE_CONTENT.archiveSubheading,
      emptyStateTitle: emptyStateTitle || DEFAULT_JOURNALS_PAGE_CONTENT.emptyStateTitle,
      emptyStateMessage: emptyStateMessage || DEFAULT_JOURNALS_PAGE_CONTENT.emptyStateMessage,
    });

    const updated = await prisma.pageContent.upsert({
      where: { slug: "journals" },
      update: {
        title: title.trim(),
        subtitle: subtitle?.trim() || "",
        content: contentJson,
        updatedBy: session.user.email,
      },
      create: {
        slug: "journals",
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
        details: { slug: "journals", title: updated.title, updatedBy: session.user.email },
      },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: "Journals page content updated successfully.",
    });
  } catch (err: any) {
    console.error("[POST /api/admin/pages/journals]", err);
    return NextResponse.json({ error: "Failed to update journals page content" }, { status: 500 });
  }
}
