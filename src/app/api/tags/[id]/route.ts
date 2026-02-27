import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { normalizeTagSlug, normalizeTagLabel } from "@/lib/tags";

// PATCH /api/tags/:id — rename a tag
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { label } = body;

  if (!label) {
    return NextResponse.json({ error: "Label is required" }, { status: 400 });
  }

  const slug = normalizeTagSlug(label);
  const tag = await prisma.tag.update({
    where: { id },
    data: { slug, label: normalizeTagLabel(label) },
  });

  return NextResponse.json({ tag });
}

// DELETE /api/tags/:id — delete a tag (removes from all assets)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // Cascade will remove asset_tags entries
  await prisma.tag.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
