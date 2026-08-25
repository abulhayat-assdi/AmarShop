import { describe, expect, it } from "vitest";
import {
  DEFAULT_ANTHROPIC_MODEL,
  DEFAULT_OPENAI_BASE_URL,
  DEFAULT_OPENAI_MODEL,
  isAiConfigured,
  resolveAiConfig,
} from "@/lib/ai/config";

describe("resolveAiConfig", () => {
  it("returns null when no key is set", () => {
    expect(resolveAiConfig({})).toBeNull();
    expect(resolveAiConfig({ AI_PROVIDER: "anthropic" })).toBeNull();
    expect(resolveAiConfig({ AI_API_KEY: "   " })).toBeNull();
  });

  it("falls back to the legacy Anthropic variables", () => {
    const config = resolveAiConfig({
      ANTHROPIC_API_KEY: "sk-ant-x",
      ANTHROPIC_MODEL: "claude-sonnet-5",
    });
    expect(config).toMatchObject({
      provider: "anthropic",
      apiKey: "sk-ant-x",
      model: "claude-sonnet-5",
    });
  });

  it("defaults the Anthropic model", () => {
    expect(resolveAiConfig({ ANTHROPIC_API_KEY: "k" })?.model).toBe(
      DEFAULT_ANTHROPIC_MODEL,
    );
  });

  it("treats a plain AI_API_KEY as an OpenAI-compatible endpoint", () => {
    const config = resolveAiConfig({ AI_API_KEY: "sk-x" });
    expect(config).toMatchObject({
      provider: "openai-compatible",
      baseUrl: DEFAULT_OPENAI_BASE_URL,
      model: DEFAULT_OPENAI_MODEL,
    });
  });

  it("honours an explicit provider over the inferred one", () => {
    expect(
      resolveAiConfig({ AI_API_KEY: "k", AI_PROVIDER: "anthropic" })?.provider,
    ).toBe("anthropic");
    expect(
      resolveAiConfig({ ANTHROPIC_API_KEY: "k", AI_PROVIDER: "openai" })
        ?.provider,
    ).toBe("openai-compatible");
  });

  it("supports any OpenAI-compatible base URL and strips trailing slashes", () => {
    const config = resolveAiConfig({
      AI_API_KEY: "k",
      AI_BASE_URL: "https://openrouter.ai/api/v1//",
      AI_MODEL: "meta-llama/llama-3.1-70b-instruct",
    });
    expect(config).toMatchObject({
      provider: "openai-compatible",
      baseUrl: "https://openrouter.ai/api/v1",
      model: "meta-llama/llama-3.1-70b-instruct",
    });
  });

  it("infers openai-compatible from a base URL alone", () => {
    expect(
      resolveAiConfig({
        ANTHROPIC_API_KEY: "k",
        AI_BASE_URL: "http://localhost:11434/v1",
      })?.provider,
    ).toBe("openai-compatible");
  });
});

describe("isAiConfigured", () => {
  it("mirrors resolveAiConfig", () => {
    expect(isAiConfigured({})).toBe(false);
    expect(isAiConfigured({ AI_API_KEY: "k" })).toBe(true);
  });
});
