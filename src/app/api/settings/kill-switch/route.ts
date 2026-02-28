import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/settings/kill-switch
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const setting = await prisma.appSetting.findUnique({
    where: { key: "kill_switch" },
  });

  const enabled = setting
    ? (setting.value as { enabled: boolean }).enabled
    : false;

  return NextResponse.json({ enabled });
}

// PUT /api/settings/kill-switch
export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const enabled = !!body.enabled;

  await prisma.appSetting.upsert({
    where: { key: "kill_switch" },
    create: { key: "kill_switch", value: { enabled } },
    update: { value: { enabled } },
  });

  return NextResponse.json({ enabled });
}
