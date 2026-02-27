import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { executePost } from "@/lib/scheduler";

// POST /api/posts/:id/approve — approve and optionally execute a draft
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const executeNow = body.execute !== false;

  const post = await prisma.postLog.findUnique({ where: { id } });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
  if (post.status !== "DRAFTED") {
    return NextResponse.json(
      { error: `Cannot approve post with status: ${post.status}` },
      { status: 400 }
    );
  }

  await prisma.postLog.update({
    where: { id },
    data: { status: "APPROVED" },
  });

  if (executeNow) {
    const result = await executePost(id);
    return NextResponse.json(result);
  }

  return NextResponse.json({ status: "approved", postId: id });
}
