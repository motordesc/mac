import { createOpenAI } from "@ai-sdk/openai";

// ── OpenRouter provider ────────────────────────────────────────────────────

export const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
});

// ── Model registry (March 2026 top free / low-cost models) ─────────────────

export const MODELS = {
  /** DeepSeek Chat v3 — excellent logic/math reasoning (FREE) */
  DEEPSEEK_CHAT: "deepseek/deepseek-chat-v3-0324:free",
  /** Meta Llama 3.3 70B — GPT-4 level general purpose, 131K context (FREE) */
  LLAMA_70B: "meta-llama/llama-3.3-70b-instruct:free",
  /** Mistral Nemo — strong structured data, fast inference (FREE) */
  MISTRAL_NEMO: "mistralai/mistral-nemo:free",
  /** Google Gemini 2.5 Flash — massive 1M context, multimodal (paid) */
  GEMINI_FLASH: "google/gemini-2.5-flash-preview",
  /** OpenRouter Auto — dynamic model selection based on request */
  AUTO: "openrouter/auto",
} as const;

/** Human-readable labels for the model selector UI */
export const MODEL_LABELS: Record<ModelKey, string> = {
  DEEPSEEK_CHAT: "DeepSeek v3 (Free)",
  LLAMA_70B: "Llama 3.3 70B (Free)",
  MISTRAL_NEMO: "Mistral Nemo (Free)",
  GEMINI_FLASH: "Gemini 2.5 Flash",
  AUTO: "Auto (OpenRouter)",
};

export type ModelKey = keyof typeof MODELS;

/** Default model for the AI chat assistant (must be FREE) */
export const DEFAULT_MODEL: ModelKey = "DEEPSEEK_CHAT";

/** Fallback chain: try models in order if the primary fails */
export const FALLBACK_CHAIN: ModelKey[] = [
  "DEEPSEEK_CHAT",
  "LLAMA_70B",
  "MISTRAL_NEMO",
  "GEMINI_FLASH",
];

// Keep backward compat
export const FREE_MODEL = MODELS.DEEPSEEK_CHAT;
