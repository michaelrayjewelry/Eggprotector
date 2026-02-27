import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { selectAsset } from "@/lib/asset-selector";

// POST /api/agent/select-asset — agent picks an image for a post
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { intent, required_tags, preferred_tags, constraints } = body;

  const asset = await selectAsset({
    intent,
    required_tags,
    preferred_tags,
    constraints,
  });

  if (!asset) {
    return NextResponse.json(
      { error: "No matching asset found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ asset });
}
