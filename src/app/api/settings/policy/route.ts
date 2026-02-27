import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getPolicy, DEFAULT_POLICY } from "@/lib/policy";

// GET /api/settings/policy
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const policy = await getPolicy();
  return NextResponse.json({ policy });
}

// PUT /api/settings/policy
export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  // Merge with defaults to ensure all fields exist
  const config = { ...DEFAULT_POLICY, ...body };

  // Deactivate old rules
  await prisma.policyRule.updateMany({
    where: { active: true },
    data: { active: false },
  });

  // Create new active rule
  const rule = await prisma.policyRule.create({
    data: { config, active: true },
  });

  return NextResponse.json({ policy: rule.config });
}
