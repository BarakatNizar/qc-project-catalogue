
import { NextResponse } from "next/server";
import { PROJECT_BRIEFING_PROMPT } from "@/infrastructure/ai/prompts"; 

export const dynamic = "force-dynamic";

export async function GET() {
  if (
    typeof PROJECT_BRIEFING_PROMPT !== "string" ||
    !PROJECT_BRIEFING_PROMPT.trim()
  ) {
    return NextResponse.json(
      { error: "The project briefing prompt is not configured." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { prompt: PROJECT_BRIEFING_PROMPT },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
