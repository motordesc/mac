import { createOpenAI } from "@ai-sdk/openai";

// ── OpenRouter provider ────────────────────────────────────────────────────

export const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
});

// ── Model registry (March 2026 top free / low-cost models) ─────────────────

export const MODELS = {
  /** Google Gemini 2.5 Flash — massive 1M context, multimodal, best for long docs */
  GEMINI_FLASH: "google/gemini-2.5-flash-preview",
  /** DeepSeek Chat — excellent logic/math reasoning */
  DEEPSEEK_CHAT: "deepseek/deepseek-chat-v3-0324:free",
  /** Meta Llama 3.3 70B — GPT-4 level general purpose, 131K context */
  LLAMA_70B: "meta-llama/llama-3.3-70b-instruct:free",
  /** Mistral Nemo — strong structured data, fast inference */
  MISTRAL_NEMO: "mistralai/mistral-nemo:free",
  /** OpenRouter Auto — dynamic model selection based on request */
  AUTO: "openrouter/auto",
} as const;

export type ModelKey = keyof typeof MODELS;

/** Default model for the AI chat assistant */
export const DEFAULT_MODEL: ModelKey = "GEMINI_FLASH";

/** Fallback chain: try models in order if the primary fails */
export const FALLBACK_CHAIN: ModelKey[] = [
  "GEMINI_FLASH",
  "DEEPSEEK_CHAT",
  "LLAMA_70B",
  "MISTRAL_NEMO",
];

// Keep backward compat
export const FREE_MODEL = MODELS.GEMINI_FLASH;
