import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/settings — get all app settings
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const settings = await prisma.appSetting.findMany();
  const settingsMap: Record<string, unknown> = {};
  for (const s of settings) {
    settingsMap[s.key] = s.value;
  }

  return NextResponse.json({ settings: settingsMap });
}

// PUT /api/settings — update settings
export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { key, value } = body;

  if (!key || value === undefined) {
    return NextResponse.json(
      { error: "Key and value are required" },
      { status: 400 }
    );
  }

  const setting = await prisma.appSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });

  return NextResponse.json({ setting });
}
