/**
 * AI provider configuration (spec §5.7).
 *
 * The AI design editor is provider-agnostic: it talks either to Anthropic's
 * native Messages API or to any OpenAI-compatible `/chat/completions` endpoint
 * (OpenAI, OpenRouter, Groq, DeepSeek, Together, Google's OpenAI-compat
 * endpoint, a local Ollama/LM Studio, …). Only a base URL and a model name
 * change between them.
 *
 * Resolution is a pure function of the environment so it can be unit-tested and
 * so the "is AI configured?" check never needs a network call.
 */
export const AI_PROVIDERS = ["anthropic", "openai-compatible"] as const;
export type AiProvider = (typeof AI_PROVIDERS)[number];

export type AiConfig = {
  provider: AiProvider;
  apiKey: string;
  /** Base URL without a trailing slash. Unused by the Anthropic SDK path. */
  baseUrl: string;
  model: string;
};

export const DEFAULT_ANTHROPIC_MODEL = "claude-opus-5";
export const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
export const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
export const DEFAULT_ANTHROPIC_BASE_URL = "https://api.anthropic.com";

type EnvSource = Record<string, string | undefined>;

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * Reads the AI settings from an environment-like object.
 *
 * `AI_PROVIDER` / `AI_API_KEY` / `AI_BASE_URL` / `AI_MODEL` are the current
 * variables. `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` still work as a fallback
 * so existing installs keep running unchanged.
 *
 * Returns null when no API key is available — the feature is then disabled
 * rather than failing at request time.
 */
export function resolveAiConfig(source: EnvSource): AiConfig | null {
  const requested = clean(source.AI_PROVIDER)?.toLowerCase();
  const apiKey = clean(source.AI_API_KEY) ?? clean(source.ANTHROPIC_API_KEY);
  if (!apiKey) return null;

  // Explicit setting wins; otherwise assume Anthropic only when the sole key
  // present is the legacy ANTHROPIC_API_KEY, else an OpenAI-compatible endpoint.
  const provider: AiProvider =
    requested === "anthropic"
      ? "anthropic"
      : requested === "openai-compatible" ||
          requested === "openai" ||
          clean(source.AI_BASE_URL)
        ? "openai-compatible"
        : clean(source.AI_API_KEY)
          ? "openai-compatible"
          : "anthropic";

  const baseUrl = stripTrailingSlash(
    clean(source.AI_BASE_URL) ??
      (provider === "anthropic"
        ? DEFAULT_ANTHROPIC_BASE_URL
        : DEFAULT_OPENAI_BASE_URL),
  );

  const model =
    clean(source.AI_MODEL) ??
    clean(source.ANTHROPIC_MODEL) ??
    (provider === "anthropic" ? DEFAULT_ANTHROPIC_MODEL : DEFAULT_OPENAI_MODEL);

  return { provider, apiKey, baseUrl, model };
}

/** True when the server has enough configuration to run an AI edit. */
export function isAiConfigured(source: EnvSource = process.env): boolean {
  return resolveAiConfig(source) !== null;
}
