import Anthropic from "@anthropic-ai/sdk";
import type { AiConfig } from "./config";

/**
 * Single call the AI editor needs: "given a system prompt and a user prompt,
 * return the model's text". Two transports implement it — Anthropic's native
 * Messages API and any OpenAI-compatible `/chat/completions` endpoint — so
 * swapping providers is a matter of environment variables only.
 */
const MAX_TOKENS = 16000;

export async function generateText(
  config: AiConfig,
  system: string,
  user: string,
): Promise<string> {
  return config.provider === "anthropic"
    ? generateAnthropic(config, system, user)
    : generateOpenAiCompatible(config, system, user);
}

async function generateAnthropic(
  config: AiConfig,
  system: string,
  user: string,
): Promise<string> {
  const client = new Anthropic({
    apiKey: config.apiKey,
    ...(config.baseUrl ? { baseURL: config.baseUrl } : {}),
  });

  const response = await client.messages.create({
    model: config.model,
    max_tokens: MAX_TOKENS,
    system,
    messages: [{ role: "user", content: user }],
  });

  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}

type ChatCompletion = {
  choices?: { message?: { content?: string | null } }[];
  error?: { message?: string };
};

async function generateOpenAiCompatible(
  config: AiConfig,
  system: string,
  user: string,
): Promise<string> {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: MAX_TOKENS,
      // Providers that support it return strict JSON; the ones that ignore the
      // hint still work because the response is JSON-extracted either way.
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  const body = (await response.json().catch(() => null)) as ChatCompletion | null;

  if (!response.ok) {
    throw new Error(
      body?.error?.message
        ? `AI provider error: ${body.error.message}`
        : `AI provider returned HTTP ${response.status}.`,
    );
  }

  const text = body?.choices?.[0]?.message?.content;
  if (!text) throw new Error("The AI provider returned an empty response.");
  return text;
}
