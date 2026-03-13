import { NextResponse } from "next/server";
import { generateDailyBriefing } from "@/lib/anthropic";

export async function POST(request: Request) {
  try {
    const metrics = await request.json();
    const briefing = await generateDailyBriefing(metrics);
    return NextResponse.json(briefing);
  } catch (error) {
    console.error("AI briefing error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI briefing error" },
      { status: 500 }
    );
  }
}
