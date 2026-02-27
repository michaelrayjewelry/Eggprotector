import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { runSlot, type Slot } from "@/lib/scheduler";

// POST /api/agent/run?slot=morning|midday|evening
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const slot = req.nextUrl.searchParams.get("slot") as Slot | null;
  if (!slot || !["morning", "midday", "evening"].includes(slot)) {
    return NextResponse.json(
      { error: "Invalid slot. Must be morning, midday, or evening." },
      { status: 400 }
    );
  }

  const result = await runSlot(slot, user.id);
  return NextResponse.json(result);
}
