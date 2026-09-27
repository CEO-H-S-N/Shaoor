// Shaoor.org — Paper Submission & Draft Creation API
// Directly creates papers and attached scientific figures in PostgreSQL via Prisma

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const FigureSchema = z.object({
  figureNumber: z.number().int().positive(),
  title: z.string().trim().min(1, "Figure title is required").max(200),
  caption: z.string().trim().max(2000).optional().nullable(),
  fileUrl: z.string().trim().min(1, "Figure file URL is required"),
  fileName: z.string().trim().min(1, "Figure file name is required"),
  fileSize: z.number().int().optional().nullable(),
});

const CreatePaperSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(300, "Title cannot exceed 300 characters"),
  abstract: z.string().trim().min(50, "Abstract must be at least 50 characters").max(5000, "Abstract cannot exceed 5000 characters"),
  categoryId: z.string().trim().optional().nullable().or(z.literal("")),
  keywords: z.array(z.string().trim()).min(1, "At least one keyword is required").max(10, "Up to 10 keywords allowed"),
  fileUrl: z.string().trim().optional().nullable(),
  fileName: z.string().trim().optional().nullable(),
  fileSize: z.number().int().optional().nullable(),
  status: z.enum(["DRAFT", "SUBMITTED"]).default("SUBMITTED"),
  figures: z.array(FigureSchema).optional().default([]),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = CreatePaperSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid submission data" },
        { status: 400 }
      );
    }

    const { title, abstract, categoryId, keywords, fileUrl, fileName, fileSize, status, figures } = parsed.data;

    // If submitting for peer review, manuscript file is mandatory
    if (status === "SUBMITTED" && !fileUrl) {
      return NextResponse.json(
        { error: "A manuscript file (PDF or DOCX) is required to submit for peer review." },
        { status: 400 }
      );
    }

    // Verify category exists if provided
    let validCategoryId: string | null = null;
    if (categoryId) {
      const cat = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { id: true },
      });
      if (cat) validCategoryId = cat.id;
    }

    // If no category was selected or invalid, pick the first active category
    if (!validCategoryId) {
      const defaultCat = await prisma.category.findFirst({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true },
      });
      if (defaultCat) validCategoryId = defaultCat.id;
    }

    // Create Paper with attached figures
    const paper = await prisma.paper.create({
      data: {
        title,
        abstract,
        categoryId: validCategoryId,
        keywords,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileSize: fileSize || null,
        authorId: session.user.id,
        status,
        submittedAt: status === "SUBMITTED" ? new Date() : null,
        figures: figures && figures.length > 0
          ? {
              create: figures.map((fig, idx) => ({
                figureNumber: fig.figureNumber || idx + 1,
                title: fig.title,
                caption: fig.caption || null,
                fileUrl: fig.fileUrl,
                fileName: fig.fileName,
                fileSize: fig.fileSize || null,
              })),
            }
          : undefined,
      },
      include: {
        category: { select: { id: true, name: true, color: true } },
        figures: { orderBy: { figureNumber: "asc" } },
      },
    });

    // Notify admins if submitted for review
    if (status === "SUBMITTED") {
      const admins = await prisma.user.findMany({
        where: { role: { in: ["ADMIN", "DESIGNER"] }, isActive: true },
        select: { id: true },
      });

      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            type: "PAPER_SUBMITTED",
            title: "New Paper Submitted",
            message: `"${paper.title}" was submitted by ${session.user.name || "an author"} for review.`,
            metadata: { paperId: paper.id },
          })),
        }).catch(() => {});
      }
    }

    // Audit Log (OWASP A09)
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: status === "DRAFT" ? "PAPER_DRAFT_CREATED" : "PAPER_SUBMITTED",
        resourceType: "paper",
        resourceId: paper.id,
        details: {
          title: paper.title,
          figuresCount: figures?.length || 0,
          status,
        },
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: status === "DRAFT" ? "Draft saved successfully." : "Paper submitted for peer review.",
      paper,
    });
  } catch (err: any) {
    console.error("[POST /api/papers]", err);
    return NextResponse.json(
      { error: err?.message || "Failed to create paper submission." },
      { status: 500 }
    );
  }
}
