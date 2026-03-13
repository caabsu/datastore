// Anthropic Claude Sonnet 4.6 client for AI workflows
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const MODEL = "claude-sonnet-4-6-20250514";

export async function generateDailyBriefing(metrics: {
  netRevenue: number;
  adSpend: number;
  blendedROAS: number;
  orders: number;
  aov: number;
  contributionMargin: number;
  cmPct: number;
  topChannel: string;
  topChannelROAS: number;
  metaSpend: number;
  metaRevenue: number;
  metaROAS: number;
  googleSpend?: number;
  googleRevenue?: number;
  googleROAS?: number;
  newCustomerPct: number;
  refundRate: number;
}): Promise<{ summary: string; highlights: string[] }> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `You are the AI analyst for Datastore, a DTC brand analytics platform. Generate a concise daily briefing (2-3 sentences) and 3-5 short highlight tags based on these metrics:

${JSON.stringify(metrics, null, 2)}

Respond in JSON format:
{
  "summary": "2-3 sentence analysis of today's performance, trends, and actionable insight",
  "highlights": ["tag1", "tag2", "tag3"]
}

Be specific with numbers. Focus on what's working, what needs attention, and one actionable recommendation. Keep highlights under 5 words each.`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  try {
    return JSON.parse(text);
  } catch {
    return {
      summary: text,
      highlights: [],
    };
  }
}

export async function analyzeMetric(
  metricName: string,
  currentValue: number,
  previousValue: number,
  context: string
): Promise<string> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `Briefly analyze this DTC metric change (1-2 sentences):

Metric: ${metricName}
Current: ${currentValue}
Previous: ${previousValue}
Change: ${(((currentValue - previousValue) / previousValue) * 100).toFixed(1)}%
Context: ${context}

Be concise and actionable.`,
      },
    ],
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}
