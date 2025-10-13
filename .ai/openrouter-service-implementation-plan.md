## Usługa OpenRouter – przewodnik implementacji (Next.js 15, TS, RSC, Zod)

### 1) Opis usługi

Usługa OpenRouter to cienka, bezpieczna warstwa serwerowa (RSC/Server Actions + Route Handlers) opakowująca wywołania `https://openrouter.ai/api/v1/chat/completions`. Zapewnia:

- Walidację wejścia/wyjścia (Zod)
- Spójny interfejs do wywołań non‑stream i stream
- Konfigurację modeli i parametrów w jednym miejscu
- Obsługę ustrukturyzowanych odpowiedzi przez `response_format` (JSON Schema)
- Odporność (retry, timeouts, kontrola błędów) i bezpieczeństwo (serwer‑only key)

Jest używana z:
- Server Actions (mutacje, szybkie odpowiedzi)
- Route Handlers (SSE/streaming do UI z Suspense/Streaming)


### 2) Opis „konstruktora” (funkcyjna fabryka)

Zgodnie z zasadą „preferuj funkcje nad klasami”, tworzymy fabrykę:

```ts
// app/lib/services/openrouter.ts
export interface OpenRouterConfig {
  apiKey: string;               // z env, serwer-only
  baseUrl?: string;             // domyślnie https://openrouter.ai/api/v1
  referer?: string;             // wymagane przez OpenRouter do identyfikacji aplikacji
  title?: string;               // X-Title – czytelna nazwa zapytania/aplikacji
  defaultModel?: string;        // np. "anthropic/claude-3.5-sonnet:beta"
  defaultParams?: {
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
  };
  timeoutMs?: number;           // np. 30000
  maxRetries?: number;          // np. 2-3
}

export function createOpenRouterService(config: OpenRouterConfig) { /* zwraca obiekt metod */ }
```

Cel: hermetyzacja nagłówków, walidacji, retry i budowania payloadu. Fabryka zwraca zestaw metod publicznych do wywołań.


### 3) Publiczne metody i pola

- `complete(input: CompleteInput): Promise<LLMText>`
  - Synchroniczna (non‑stream) kompletacja czatu.
  - Wspiera „komunikat systemowy”, „komunikat użytkownika”, nazwę modelu i parametry.

- `completeStructured<T>(input: CompleteStructuredInput<T>): Promise<T>`
  - Jak wyżej, ale wymusza odpowiedź zgodną z JSON Schema przez `response_format`.
  - Waliduje wynik Zodem (opcjonalnie) i/lub zgodność z JSON Schema.

- `stream(input: CompleteInput): Promise<ReadableStream<Uint8Array>>`
  - Zwraca strumień (SSE/JSON chunked) – do przekazania 1:1 przez `app/api/.../route.ts` do klienta.

- `getDefaultModel(): string`
- `getDefaultParams(): Record<string, unknown>`

Minimalne typy danych:

```ts
// app/lib/validators/ai.ts
import { z } from "zod";

export const ModelParamsSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().positive().optional(),
  top_p: z.number().min(0).max(1).optional(),
  frequency_penalty: z.number().min(0).max(2).optional(),
  presence_penalty: z.number().min(0).max(2).optional(),
}).strict();

export const CompleteInputSchema = z.object({
  system: z.string().min(1).optional(),
  user: z.string().min(1),
  model: z.string().min(1).optional(),
  params: ModelParamsSchema.optional(),
});

export type CompleteInput = z.infer<typeof CompleteInputSchema>;
export type LLMText = string;

export const CompleteStructuredInputSchema = CompleteInputSchema.extend({
  jsonSchema: z.object({ name: z.string(), strict: z.literal(true), schema: z.record(z.any()) }),
});

export type CompleteStructuredInput<T> = z.infer<typeof CompleteStructuredInputSchema> & { _type?: T };
```


### 4) Prywatne metody i pola

Wewnątrz fabryki zalecane są pomocnicze funkcje:

- `buildHeaders(config): Headers`
  - Ustawia: `Authorization: Bearer <apiKey>`, `HTTP-Referer`, `X-Title`, `Content-Type: application/json`.

- `buildMessages(system?: string, user: string)`
  - Zwraca tablicę `{ role: 'system'|'user', content: string }[]` zgodną z OpenRouter.

- `buildBody(input): object`
  - Składa `model`, `messages`, `...params`.

- `buildStructuredBody(input): object`
  - Jak wyżej + `response_format`:
  ```json
  {
    "response_format": {
      "type": "json_schema",
      "json_schema": { "name": "<schema-name>", "strict": true, "schema": { /* JSON Schema */ } }
    }
  }
  ```

- `safeFetch(url, init)`
  - Timeout + retry (np. exponential backoff: 250ms, 1s, 2s) na kody 429/5xx.

- `parseTextResponse(res)` / `parseStreamResponse(res)`
  - Normalizuje odpowiedź dostawców pod ujednolicone wyjście (tekst/strumień).


### 5) Obsługa błędów

Potencjalne scenariusze i zalecenia:

1. 401/403 – błędny/nieobecny klucz API
   - Zwróć 500/401 do klienta, zaloguj bez treści użytkownika. Sprawdź env i nagłówki.
2. 429 – limit zapytań / przepustowości
   - Retry z backoffem, krótki fallback komunikatu „spróbuj ponownie”.
3. 5xx – błąd dostawcy/modelu
   - 1‑3 próby, potem kontrolowany błąd z informacją, że model chwilowo niedostępny.
4. Timeout – brak odpowiedzi w `timeoutMs`
   - Przerwij żądanie, zwróć błąd i sugestię ponowienia.
5. 400 – niewspierane parametry/model
   - Uprzednia walidacja Zod + allowlista modeli.
6. Niepoprawny JSON (structured)
   - Włącz `strict: true`, waliduj JSON Zodem. Na błąd – miękki fallback do tekstu lub prośba o ponowienie.
7. Treści zablokowane/przefiltrowane
   - Zwróć komunikat polityki i poproś o zmianę treści zapytania.


### 6) Kwestie bezpieczeństwa

- Klucz `OPENROUTER_API_KEY` wyłącznie po stronie serwera (Server Actions/Route Handlers).
- Nie loguj pełnych promptów ani danych wrażliwych; jeśli konieczne – maskuj (np. e‑maile, numery tel.).
- Ustal limity wejścia (np. 2–4k znaków) i modelu (`max_tokens`).
- Allowlista modeli dopuszczonych w aplikacji.
- Rate limiting na Route Handlerze (możesz wykorzystać istniejący `app/lib/middleware/rate-limiter.ts`).
- Wymagaj autoryzacji (NextAuth v5) przed użyciem usługi, jeżeli funkcja ma dostęp do danych użytkownika.


### 7) Plan wdrożenia krok po kroku

#### 7.1 Zmienne środowiskowe (.env.local)

Dodaj:

```dotenv
# OpenRouter
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
# Używane jako HTTP-Referer (OpenRouter prosi o identyfikację źródła)
OPENROUTER_REFERER=http://localhost:3000
# Krótka nazwa aplikacji/zapytania (opcjonalnie trafia do X-Title)
OPENROUTER_APP_TITLE=TickFlow AI Helper
```

Jeśli masz już `NEXTAUTH_URL`, możesz użyć go jako `OPENROUTER_REFERER` (preferuj jawne ustawienie dla czytelności).

#### 7.2 Walidatory (Zod)

Utwórz/uzupełnij `app/lib/validators/ai.ts` zgodnie z sekcją Publiczne metody i pola.

#### 7.3 Implementacja usługi

Utwórz plik `app/lib/services/openrouter.ts`:

```ts
"use server";
import { z } from "zod";
import {
  CompleteInputSchema,
  CompleteStructuredInputSchema,
  type CompleteInput,
  type CompleteStructuredInput,
} from "@/app/lib/validators/ai";

export interface OpenRouterConfig { /* jak w sekcji konstruktora */ }

function buildHeaders(cfg: OpenRouterConfig): Headers {
  const h = new Headers({ "Content-Type": "application/json" });
  h.set("Authorization", `Bearer ${cfg.apiKey}`);
  if (cfg.referer) h.set("HTTP-Referer", cfg.referer);
  if (cfg.title) h.set("X-Title", cfg.title);
  return h;
}

function buildMessages(system: string | undefined, user: string) {
  const msgs: Array<{ role: "system" | "user"; content: string }> = [];
  if (system) msgs.push({ role: "system", content: system });
  msgs.push({ role: "user", content: user });
  return msgs;
}

export function createOpenRouterService(cfg: OpenRouterConfig) {
  const baseUrl = cfg.baseUrl ?? "https://openrouter.ai/api/v1";
  const endpoint = `${baseUrl}/chat/completions`;
  const headers = buildHeaders(cfg);

  async function safeFetch(body: unknown, opts?: { stream?: boolean }) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), cfg.timeoutMs ?? 30000);
    const init: RequestInit = {
      method: "POST",
      headers,
      body: JSON.stringify({ ...body, stream: opts?.stream ?? false }),
      signal: controller.signal,
    };

    let attempt = 0;
    const max = cfg.maxRetries ?? 2;
    // proste retry na 429/5xx
    for (;;) {
      try {
        const res = await fetch(endpoint, init);
        if (res.status === 429 || res.status >= 500) {
          if (attempt++ < max) {
            const backoff = Math.min(2000, 250 * 2 ** attempt);
            await new Promise(r => setTimeout(r, backoff));
            continue;
          }
        }
        clearTimeout(timeout);
        return res;
      } catch (e) {
        if (attempt++ < max) {
          const backoff = Math.min(2000, 250 * 2 ** attempt);
          await new Promise(r => setTimeout(r, backoff));
          continue;
        }
        clearTimeout(timeout);
        throw e;
      }
    }
  }

  async function complete(input: CompleteInput): Promise<string> {
    const { system, user, model, params } = CompleteInputSchema.parse(input);
    const body = {
      model: model ?? cfg.defaultModel ?? "anthropic/claude-3.5-sonnet:beta",
      messages: buildMessages(system, user),
      ...(cfg.defaultParams ?? {}),
      ...(params ?? {}),
    };
    const res = await safeFetch(body);
    if (!res.ok) {
      throw new Error(`OpenRouter error ${res.status}`);
    }
    const json = await res.json();
    // normalizacja: OpenRouter zwraca choices[0].message.content
    const text = json?.choices?.[0]?.message?.content ?? "";
    return typeof text === "string" ? text : JSON.stringify(text);
  }

  async function completeStructured<T>(input: CompleteStructuredInput<T>): Promise<T> {
    const { system, user, model, params, jsonSchema } = CompleteStructuredInputSchema.parse(input);
    const body = {
      model: model ?? cfg.defaultModel ?? "anthropic/claude-3.5-sonnet:beta",
      messages: buildMessages(system, user),
      ...(cfg.defaultParams ?? {}),
      ...(params ?? {}),
      response_format: { type: "json_schema", json_schema: jsonSchema },
    };
    const res = await safeFetch(body);
    if (!res.ok) throw new Error(`OpenRouter error ${res.status}`);
    const json = await res.json();
    const raw = json?.choices?.[0]?.message?.content;
    // treść zwykle jest stringiem JSON; zapewniamy parse
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return parsed as T;
  }

  async function stream(input: CompleteInput): Promise<ReadableStream<Uint8Array>> {
    const { system, user, model, params } = CompleteInputSchema.parse(input);
    const body = {
      model: model ?? cfg.defaultModel ?? "anthropic/claude-3.5-sonnet:beta",
      messages: buildMessages(system, user),
      ...(cfg.defaultParams ?? {}),
      ...(params ?? {}),
    };
    const res = await safeFetch(body, { stream: true });
    if (!res.ok || !res.body) throw new Error(`OpenRouter stream error ${res.status}`);
    return res.body;
  }

  return { complete, completeStructured, stream, getDefaultModel: () => cfg.defaultModel ?? "", getDefaultParams: () => cfg.defaultParams ?? {} };
}
```

#### 7.4 Konfiguracja serwera (adapter)

Utwórz adapter inicjalizujący usługę z env zmiennymi:

```ts
// app/lib/services/openrouter.server.ts
import { createOpenRouterService } from "@/app/lib/services/openrouter";

export const openrouter = createOpenRouterService({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseUrl: process.env.OPENROUTER_BASE_URL,
  referer: process.env.OPENROUTER_REFERER ?? process.env.NEXTAUTH_URL,
  title: process.env.OPENROUTER_APP_TITLE,
  defaultModel: "anthropic/claude-3.5-sonnet:beta",
  defaultParams: { temperature: 0.2, max_tokens: 600 },
  timeoutMs: 30000,
  maxRetries: 2,
});
```

#### 7.5 Server Action – przykład non‑stream + structured

```ts
// app/actions/ai/complete.ts
"use server";
import { z } from "zod";
import { openrouter } from "@/app/lib/services/openrouter.server";

export const completeAi = async (formData: FormData) => {
  const schema = z.object({
    description: z.string().min(10),
  });
  const { description } = schema.parse({ description: formData.get("description") });

  const system = "Jesteś asystentem TickFlow. Klasyfikujesz problem i sugerujesz kroki oraz właściwą kategorię i podkategorię ticketu.";

  // ustrukturyzowana odpowiedź – przykład JSON Schema
  const jsonSchema = {
    name: "ticket_guidance",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        categoryId: { type: "string" },
        subcategoryId: { type: "string" },
        summary: { type: "string" },
        suggestedSteps: { type: "array", items: { type: "string" } },
      },
      required: ["categoryId", "subcategoryId", "summary", "suggestedSteps"],
    },
  } as const;

  return await openrouter.completeStructured<{ categoryId: string; subcategoryId: string; summary: string; suggestedSteps: string[] }>({
    system,
    user: description,
    params: { temperature: 0.1 },
    jsonSchema,
  });
};
```

#### 7.6 Route Handler – streaming do UI

```ts
// app/api/ai/complete/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import { openrouter } from "@/app/lib/services/openrouter.server";

export const runtime = "nodejs"; // streaming w Node runtime

const BodySchema = z.object({
  prompt: z.string().min(1),
  model: z.string().optional(),
  params: z.object({}).passthrough().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { prompt, model, params } = BodySchema.parse(body);

  const system = "Jesteś asystentem TickFlow. Odpowiadasz zwięźle i pomocnie.";
  const stream = await openrouter.stream({ system, user: prompt, model, params });

  return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
}
```

#### 7.7 Jak skonfigurować poszczególne elementy (wymogi OpenRouter)

1) Komunikat systemowy – przykład użycia

```ts
const system = "Jesteś asystentem TickFlow. Pomagasz użytkownikowi dobrać kategorię ticketu.";
await openrouter.complete({ system, user: "Nie działa drukarka HP LaserJet..." });
```

2) Komunikat użytkownika – przykład

```ts
await openrouter.complete({ user: "VPN rozłącza się co 5 minut" });
```

3) Ustrukturyzowane odpowiedzi przez `response_format`

Wzór:

```ts
const jsonSchema = {
  name: "ticket_guidance",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      categoryId: { type: "string" },
      subcategoryId: { type: "string" },
      summary: { type: "string" },
      suggestedSteps: { type: "array", items: { type: "string" } },
    },
    required: ["categoryId", "subcategoryId", "summary", "suggestedSteps"],
  },
} as const;

const data = await openrouter.completeStructured<typeof jsonSchema>(
  { system, user: description, jsonSchema }
);
```

4) Nazwa modelu – przykład

```ts
await openrouter.complete({ user: prompt, model: "anthropic/claude-3.5-sonnet:beta" });
// lub: "openai/gpt-4o-mini", "google/gemini-1.5-pro-latest" – utrzymuj allowlistę
```

5) Parametry modelu – przykład

```ts
await openrouter.complete({
  user: prompt,
  params: { temperature: 0.2, max_tokens: 500, top_p: 0.95 },
});
```

#### 7.8 Integracja z UI (MVP)

- Formularz (client component) wysyła opis problemu do Server Action `completeAi` lub do endpointu streamingowego.
- Dla structured: renderuj wynik (kroki, dopasowane `categoryId/subcategoryId`).
- Dla stream: użyj `fetch` i czytania `ReadableStream` z kontrolą stanu ładowania (Suspense/Streaming).

Przykładowy klient do endpointu stream:

```ts
const res = await fetch("/api/ai/complete", { method: "POST", body: JSON.stringify({ prompt }) });
const reader = res.body!.getReader();
const decoder = new TextDecoder();
let acc = "";
for (;;) {
  const { value, done } = await reader.read();
  if (done) break;
  acc += decoder.decode(value, { stream: true });
  // aktualizuj UI fragmentami
}
```

#### 7.9 Testy i weryfikacja

- Sprawdź 401/403 przy braku klucza.
- Wymuś 429 (np. wiele szybkich zapytań) – potwierdź retry.
- Złam JSON Schema w structured – zweryfikuj komunikat błędu.
- Sprawdź limit długości promptu (> 4k znaków) – oczekuj kontrolowanego błędu.


---

### Załączniki – szybkie odniesienia

• Endpoint: `POST https://openrouter.ai/api/v1/chat/completions`

• Nagłówki: `Authorization: Bearer <OPENROUTER_API_KEY>`, `HTTP-Referer: <URL>`, `X-Title: <opcjonalnie>`

• Body (minimum):

```json
{
  "model": "anthropic/claude-3.5-sonnet:beta",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "temperature": 0.2,
  "max_tokens": 600
}
```

• Body (structured):

```json
{
  "model": "anthropic/claude-3.5-sonnet:beta",
  "messages": [ { "role": "user", "content": "..." } ],
  "response_format": {
    "type": "json_schema",
    "json_schema": {
      "name": "ticket_guidance",
      "strict": true,
      "schema": {
        "type": "object",
        "properties": { "summary": { "type": "string" } },
        "required": ["summary"],
        "additionalProperties": false
      }
    }
  }
}
```

• Zalecane modele (MVP): `openai/gpt-4o-mini`


