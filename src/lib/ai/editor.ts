import Anthropic from "@anthropic-ai/sdk";
import { type Block, BLOCK_TYPES, parseBlocks } from "@/lib/blocks/schemas";

/**
 * AI design editor (spec §5.7). A natural-language instruction becomes a
 * JSON-schema-bounded change to the site's blocks: Claude returns the full new
 * blocks array, which is then validated with parseBlocks (the authoritative
 * gate) before it is applied. Claude never returns raw code — only structured
 * block data.
 */
const DEFAULT_MODEL = "claude-opus-5";

function systemPrompt(): string {
  return [
    "You edit a website's structured layout. A site is a JSON array of blocks;",
    'each block is {"type": <BlockType>, "data": {...}}.',
    `Allowed block types: ${BLOCK_TYPES.join(", ")}.`,
    "Rules:",
    '- Respond with ONLY a JSON object: {"blocks": [ ...the full updated array... ]}.',
    "- Use only the allowed block types and keep each block's existing data fields.",
    "- Preserve current content unless the instruction changes it; apply the",
    "  requested edit (reorder, add, remove, or change text/colors/images).",
    "- Never output HTML, CSS, scripts, or any raw code — only structured data.",
  ].join("\n");
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text.trim();
}

export async function applyAiEdit(
  currentBlocks: unknown,
  instruction: string,
): Promise<Block[]> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "AI editing is not configured (ANTHROPIC_API_KEY is not set).",
    );
  }

  const client = new Anthropic();
  const current = parseBlocks(currentBlocks);

  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
    max_tokens: 16000,
    system: systemPrompt(),
    messages: [
      {
        role: "user",
        content: [
          "Current blocks:",
          JSON.stringify(current, null, 2),
          "",
          `Instruction: ${instruction}`,
          "",
          'Return the full updated site as {"blocks":[...]}.',
        ].join("\n"),
      },
    ],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(text));
  } catch {
    throw new Error("The AI returned a response that could not be parsed.");
  }

  const blocksRaw =
    parsed && typeof parsed === "object" && "blocks" in parsed
      ? (parsed as { blocks: unknown }).blocks
      : parsed;

  const validated = parseBlocks(blocksRaw);
  if (validated.length === 0) {
    throw new Error(
      "The AI did not produce a valid layout. Please rephrase your request.",
    );
  }
  return validated;
}
