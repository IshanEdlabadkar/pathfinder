// src/lib/openrouter.ts

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function chatCompletion({
  model,
  systemPrompt,
  userMessage,
  temperature = 0.3,
}: {
  model: string;
  systemPrompt: string;
  userMessage: string;
  temperature?: number;
}): Promise<string> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter error: ${response.status} — ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export function parseJsonResponse(raw: string): any {
  // Strip markdown code fences if present
  const cleaned = raw
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();

  return JSON.parse(cleaned);
}