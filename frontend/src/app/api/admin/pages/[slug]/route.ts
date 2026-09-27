import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_ABOUT_CONTENT,
  DEFAULT_GUIDELINES_CONTENT,
  PageTemplateData,
} from "@/lib/pageContentDefaults";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const resolved = await Promise.resolve(params);
    const slug = resolved.slug;

    if (slug !== "about" && slug !== "author-guidelines") {
      return NextResponse.json({ error: "Invalid page slug" }, { status: 404 });
    }

    const defaultData: PageTemplateData =
      slug === "about" ? DEFAULT_ABOUT_CONTENT : DEFAULT_GUIDELINES_CONTENT;

    const page = await prisma.pageContent.findUnique({
      where: { slug },
    });

    if (!page) {
      return NextResponse.json({
        slug,
        title: defaultData.title,
        subtitle: defaultData.subtitle,
        sections: defaultData.sections,
        isDefault: true,
      });
    }

    let parsedSections = defaultData.sections;
    try {
      parsedSections = JSON.parse(page.content);
    } catch {
      // Fallback
    }

    return NextResponse.json({
      slug: page.slug,
      title: page.title,
      subtitle: page.subtitle ?? defaultData.subtitle,
      sections: parsedSections,
      updatedAt: page.updatedAt,
      updatedBy: page.updatedBy,
      isDefault: false,
    });
  } catch (err: any) {
    console.error("[GET /api/admin/pages/[slug]]", err);
    return NextResponse.json({ error: "Failed to fetch page content" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isMaster = !!(session.user as any)?.isMaster || session.user.email === "shouket.tilwani@gmail.com";
    if (!isMaster) {
      return NextResponse.json({ error: "Forbidden. Platform owner privileges required to modify public page content." }, { status: 403 });
    }

    const resolved = await Promise.resolve(params);
    const slug = resolved.slug;

    if (slug !== "about" && slug !== "author-guidelines") {
      return NextResponse.json({ error: "Invalid page slug" }, { status: 400 });
    }

    const body = await req.json();
    const { title, subtitle, sections } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Page title is required" }, { status: 400 });
    }

    if (!Array.isArray(sections) || sections.length === 0) {
      return NextResponse.json({ error: "At least one content section is required" }, { status: 400 });
    }

    const contentString = JSON.stringify(sections);

    const updated = await prisma.pageContent.upsert({
      where: { slug },
      update: {
        title,
        subtitle: subtitle || null,
        content: contentString,
        updatedBy: session.user.email,
      },
      create: {
        slug,
        title,
        subtitle: subtitle || null,
        content: contentString,
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
        details: { slug, title, updatedBy: session.user.email },
      },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: `Content for ${title} updated and published successfully.`,
      page: updated,
    });
  } catch (err: any) {
    console.error("[POST /api/admin/pages/[slug]]", err);
    return NextResponse.json({ error: "Failed to save page content" }, { status: 500 });
  }
}
