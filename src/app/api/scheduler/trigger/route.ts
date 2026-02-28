import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { runSlot, type Slot } from "@/lib/scheduler";

// POST /api/scheduler/trigger — triggered by cron (e.g., Vercel cron, external cron)
// Requires a secret key for authentication (not user auth)
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expectedToken = `Bearer ${process.env.CRON_SECRET || "dev-cron-secret"}`;

  if (authHeader !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const slot = (body.slot as Slot) || determineSlot();

  // Find the first owner to attribute the post to
  const owner = await prisma.user.findFirst({
    where: { role: "OWNER" },
    select: { id: true },
  });

  if (!owner) {
    return NextResponse.json(
      { error: "No owner user found" },
      { status: 500 }
    );
  }

  const result = await runSlot(slot, owner.id);
  return NextResponse.json(result);
}

function determineSlot(): Slot {
  const hour = new Date().getHours();
  if (hour < 11) return "morning";
  if (hour < 16) return "midday";
  return "evening";
}
