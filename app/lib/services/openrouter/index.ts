import {
  CompleteInputSchema,
  CompleteStructuredInputSchema,
  type CompleteInput,
  type CompleteStructuredInput,
  type LLMText,
} from "@/app/lib/validators/ai";
import { OpenRouterError } from "./errors";

/**
 * Konfiguracja serwisu OpenRouter
 */
export interface OpenRouterConfig {
  apiKey: string;
  baseUrl?: string;
  referer?: string;
  title?: string;
  defaultModel?: string;
  defaultParams?: {
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
  };
  timeoutMs?: number;
  maxRetries?: number;
}

/**
 * Typ wiadomości zgodny z API OpenRouter
 */
interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Buduje nagłówki HTTP dla żądań do OpenRouter
 */
function buildHeaders(cfg: OpenRouterConfig): Headers {
  const headers = new Headers({
    "Content-Type": "application/json",
  });
  
  headers.set("Authorization", `Bearer ${cfg.apiKey}`);
  
  if (cfg.referer) {
    headers.set("HTTP-Referer", cfg.referer);
  }
  
  if (cfg.title) {
    headers.set("X-Title", cfg.title);
  }
  
  return headers;
}

/**
 * Buduje tablicę wiadomości z komunikatu systemowego i użytkownika
 */
function buildMessages(system: string | undefined, user: string): Message[] {
  const messages: Message[] = [];
  
  if (system) {
    messages.push({ role: "system", content: system });
  }
  
  messages.push({ role: "user", content: user });
  
  return messages;
}

/**
 * Tworzy instancję serwisu OpenRouter
 */
export function createOpenRouterService(cfg: OpenRouterConfig) {
  const baseUrl = cfg.baseUrl ?? "https://openrouter.ai/api/v1";
  const endpoint = `${baseUrl}/chat/completions`;
  const headers = buildHeaders(cfg);

  /**
   * Wykonuje żądanie HTTP z retry i timeoutem
   */
  async function safeFetch(
    body: Record<string, unknown>,
    opts?: { stream?: boolean }
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      cfg.timeoutMs ?? 30000
    );

    const init: RequestInit = {
      method: "POST",
      headers,
      body: JSON.stringify({ 
        stream: opts?.stream ?? false,
        ...body,
      }),
      signal: controller.signal,
    };

    let attempt = 0;
    const maxRetries = cfg.maxRetries ?? 2;

    for (;;) {
      try {
        const res = await fetch(endpoint, init);

        // Retry dla błędów przejściowych (429, 5xx)
        if (res.status === 429 || res.status >= 500) {
          if (attempt < maxRetries) {
            attempt++;
            const backoff = Math.min(2000, 250 * 2 ** attempt);
            await new Promise((resolve) => setTimeout(resolve, backoff));
            continue;
          }
        }

        clearTimeout(timeout);
        return res;
      } catch (error) {
        clearTimeout(timeout);

        // Retry dla błędów sieciowych
        if (attempt < maxRetries) {
          attempt++;
          const backoff = Math.min(2000, 250 * 2 ** attempt);
          await new Promise((resolve) => setTimeout(resolve, backoff));
          continue;
        }

        // Po wyczerpaniu prób - rzuć błąd
        if (error instanceof Error && error.name === "AbortError") {
          throw new OpenRouterError(
            "Timeout: Brak odpowiedzi w określonym czasie",
            408
          );
        }

        throw new OpenRouterError(
          "Błąd połączenia z OpenRouter",
          500,
          error
        );
      }
    }
  }

  /**
   * Przetwarza odpowiedź błędu z OpenRouter
   */
  async function handleErrorResponse(res: Response): Promise<never> {
    let errorDetails;
    
    try {
      errorDetails = await res.json();
    } catch {
      errorDetails = await res.text();
    }

    switch (res.status) {
      case 401:
      case 403:
        throw new OpenRouterError(
          "Błąd autoryzacji: Nieprawidłowy klucz API",
          res.status,
          errorDetails
        );
      case 429:
        throw new OpenRouterError(
          "Przekroczono limit zapytań. Spróbuj ponownie później.",
          res.status,
          errorDetails
        );
      case 400:
        throw new OpenRouterError(
          "Nieprawidłowe parametry żądania",
          res.status,
          errorDetails
        );
      default:
        throw new OpenRouterError(
          `OpenRouter API error: ${res.status}`,
          res.status,
          errorDetails
        );
    }
  }

  /**
   * Wykonuje standardową kompletację (non-stream)
   */
  async function complete(input: CompleteInput): Promise<LLMText> {
    const { system, user, model, params } = CompleteInputSchema.parse(input);

    const body = {
      model: model ?? cfg.defaultModel ?? "openai/gpt-4o-mini",
      messages: buildMessages(system, user),
      ...(cfg.defaultParams ?? {}),
      ...(params ?? {}),
    };

    const res = await safeFetch(body);

    if (!res.ok) {
      await handleErrorResponse(res);
    }

    const json = await res.json();
    
    // Normalizacja odpowiedzi OpenRouter
    const text = json?.choices?.[0]?.message?.content ?? "";
    
    return typeof text === "string" ? text : JSON.stringify(text);
  }

  /**
   * Wykonuje ustrukturyzowaną kompletację z JSON Schema
   */
  async function completeStructured<T>(
    input: CompleteStructuredInput<T>
  ): Promise<T> {
    const { system, user, model, params, jsonSchema } =
      CompleteStructuredInputSchema.parse(input);

    const body = {
      model: model ?? cfg.defaultModel ?? "openai/gpt-4o-mini",
      messages: buildMessages(system, user),
      ...(cfg.defaultParams ?? {}),
      ...(params ?? {}),
      response_format: {
        type: "json_schema",
        json_schema: jsonSchema,
      },
    };

    const res = await safeFetch(body);

    if (!res.ok) {
      await handleErrorResponse(res);
    }

    const json = await res.json();
    const raw = json?.choices?.[0]?.message?.content;

    // Parsowanie odpowiedzi JSON
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      return parsed as T;
    } catch (error) {
      throw new OpenRouterError(
        "Błąd parsowania odpowiedzi JSON",
        500,
        { raw, error }
      );
    }
  }

  /**
   * Wykonuje kompletację ze streamingiem
   */
  async function stream(input: CompleteInput): Promise<ReadableStream<Uint8Array>> {
    const { system, user, model, params } = CompleteInputSchema.parse(input);

    const body = {
      model: model ?? cfg.defaultModel ?? "openai/gpt-4o-mini",
      messages: buildMessages(system, user),
      ...(cfg.defaultParams ?? {}),
      ...(params ?? {}),
    };

    const res = await safeFetch(body, { stream: true });

    if (!res.ok) {
      await handleErrorResponse(res);
    }

    if (!res.body) {
      throw new OpenRouterError(
        "Brak strumienia w odpowiedzi",
        500
      );
    }

    return res.body;
  }

  /**
   * Zwraca domyślny model
   */
  function getDefaultModel(): string {
    return cfg.defaultModel ?? "openai/gpt-4o-mini";
  }

  /**
   * Zwraca domyślne parametry
   */
  function getDefaultParams(): Record<string, unknown> {
    return cfg.defaultParams ?? {};
  }

  return {
    complete,
    completeStructured,
    stream,
    getDefaultModel,
    getDefaultParams,
  };
}

/**
 * Typ zwracanego serwisu OpenRouter
 */
export type OpenRouterService = ReturnType<typeof createOpenRouterService>;

