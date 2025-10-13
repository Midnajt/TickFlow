import { createOpenRouterService } from "@/app/lib/services/openrouter";

/**
 * Walidacja zmiennych środowiskowych
 */
function validateEnv() {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error(
      "OPENROUTER_API_KEY nie jest zdefiniowany w zmiennych środowiskowych"
    );
  }
}

// Walidacja przy imporcie
validateEnv();

/**
 * Globalny singleton serwisu OpenRouter
 * Inicjalizowany z zmiennych środowiskowych
 */
export const openrouter = createOpenRouterService({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseUrl: process.env.OPENROUTER_BASE_URL,
  referer: process.env.OPENROUTER_REFERER ?? process.env.NEXTAUTH_URL,
  title: process.env.OPENROUTER_APP_TITLE,
  defaultModel: "openai/gpt-4o-mini",
  defaultParams: {
    temperature: 0.2,
    max_tokens: 600,
  },
  timeoutMs: 30000,
  maxRetries: 2,
});

