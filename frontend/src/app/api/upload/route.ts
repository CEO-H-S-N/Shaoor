// Shaoor.org — S3 Pre-signed Upload API Route
// Generates a pre-signed PUT URL so the browser uploads directly to S3
// without passing file data through our backend — faster and cheaper.

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";
import { randomUUID } from "crypto";

const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { fileName, fileType, fileSize } = await req.json();

    // Validate file type
    if (!ALLOWED_TYPES.includes(fileType)) {
      return Response.json(
        { error: "Only PDF and DOCX files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size
    if (fileSize > MAX_FILE_SIZE) {
      return Response.json(
        { error: "File size must not exceed 20 MB" },
        { status: 400 }
      );
    }

    // Generate a safe, unique S3 key (no user-controlled path components)
    const extension = fileType === "application/pdf" ? "pdf" : "docx";
    const key = `papers/${session.user.id}/${randomUUID()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      ContentType: fileType,
      ContentLength: fileSize,
      // Tag for lifecycle management
      Tagging: `userId=${session.user.id}&status=pending`,
      // Server-side encryption
      ServerSideEncryption: "AES256",
    });

    const presignedUrl = await getSignedUrl(s3, command, {
      expiresIn: 300, // 5 minutes
    });

    return Response.json({
      uploadUrl: presignedUrl,
      fileKey: key,
      expiresIn: 300,
    });
  } catch (err) {
    console.error("Presign error:", err);
    return Response.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}
