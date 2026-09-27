// Shaoor.org — S3 Pre-signed Upload API Route
// Generates a pre-signed PUT URL for direct browser-to-S3 uploads
// Supports both manuscripts (PDF, DOCX) and scientific figures (PNG, JPG, WEBP, SVG, TIFF)

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";
import { randomUUID } from "crypto";

const s3 = new S3Client({
  region: process.env.AWS_REGION || "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const ALLOWED_MANUSCRIPT_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/msword", // .doc
];

const ALLOWED_FIGURE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/gif",
  "image/tiff",
  "application/pdf",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { fileName, fileType, fileSize, isFigure } = await req.json();

    const allowed = isFigure ? ALLOWED_FIGURE_TYPES : ALLOWED_MANUSCRIPT_TYPES;

    // Validate file type
    if (!allowed.includes(fileType)) {
      return Response.json(
        {
          error: isFigure
            ? "Figures must be PNG, JPG, WEBP, SVG, TIFF, or PDF format."
            : "Manuscript file must be PDF or DOCX format.",
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (fileSize > MAX_FILE_SIZE) {
      return Response.json(
        { error: "File size must not exceed 50 MB" },
        { status: 400 }
      );
    }

    // Determine extension
    let extension = "bin";
    if (fileType.includes("pdf")) extension = "pdf";
    else if (fileType.includes("wordprocessingml") || fileType.includes("docx")) extension = "docx";
    else if (fileType.includes("msword")) extension = "doc";
    else if (fileType.includes("png")) extension = "png";
    else if (fileType.includes("jpeg") || fileType.includes("jpg")) extension = "jpg";
    else if (fileType.includes("webp")) extension = "webp";
    else if (fileType.includes("svg")) extension = "svg";
    else if (fileType.includes("tiff")) extension = "tiff";

    const folder = isFigure ? "figures" : "papers";
    const key = `${folder}/${session.user.id}/${randomUUID()}.${extension}`;
    const bucket = process.env.AWS_S3_BUCKET_NAME || process.env.S3_BUCKET || "shaoor-papers";

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: fileType,
      ContentLength: fileSize,
      Tagging: `userId=${session.user.id}&type=${isFigure ? "figure" : "paper"}`,
      ServerSideEncryption: "AES256",
    });

    const presignedUrl = await getSignedUrl(s3, command, {
      expiresIn: 600, // 10 minutes
    });

    return Response.json({
      uploadUrl: presignedUrl,
      fileKey: key,
      fileUrl: `https://${bucket}.s3.${process.env.AWS_REGION || "eu-north-1"}.amazonaws.com/${key}`,
      expiresIn: 600,
    });
  } catch (err: any) {
    console.error("Presign error:", err);
    return Response.json(
      { error: err?.message || "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
