# OpenRouter Service - Dokumentacja

## Przegląd

Serwis OpenRouter to bezpieczna warstwa serwerowa do komunikacji z API OpenRouter (`https://openrouter.ai/api/v1/chat/completions`). Zapewnia:

- ✅ Walidację wejścia/wyjścia (Zod)
- ✅ Spójny interfejs do wywołań non-stream i stream
- ✅ Konfigurację modeli i parametrów w jednym miejscu
- ✅ Obsługę ustrukturyzowanych odpowiedzi (JSON Schema)
- ✅ Odporność na błędy (retry, timeouts)
- ✅ Bezpieczeństwo (serwer-only API key)

## Struktura plików

```
app/lib/
├── validators/
│   └── ai.ts                         # Schematy Zod dla AI
├── services/
│   └── openrouter/
│       ├── index.ts                  # Główna implementacja serwisu
│       └── server.ts                 # Adapter serwerowy (singleton)
app/actions/ai/
└── complete.ts                       # Przykładowe Server Actions
app/api/ai/
└── complete/
    └── route.ts                      # Endpoint ze streamingiem
```

## Konfiguracja

### Zmienne środowiskowe (.env.local)

```dotenv
# OpenRouter API Key (WYMAGANE)
OPENROUTER_API_KEY=sk-or-v1-...

# Base URL API (opcjonalne, domyślnie: https://openrouter.ai/api/v1)
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# HTTP Referer - identyfikacja źródła dla OpenRouter (opcjonalne)
OPENROUTER_REFERER=http://localhost:3000

# Nazwa aplikacji widoczna w logach OpenRouter (opcjonalne)
OPENROUTER_APP_TITLE=TickFlow AI Helper
```

### Dostępne modele (rekomendowane dla MVP)

```typescript
// Szybki i tani (rekomendowany dla MVP)
"openai/gpt-4o-mini"

// Alternatywy
"anthropic/claude-3.5-sonnet:beta"
"google/gemini-1.5-pro-latest"
```

## API Serwisu

### Importowanie

```typescript
import { openrouter } from "@/app/lib/services/openrouter/server";
```

### Metody publiczne

#### `complete(input: CompleteInput): Promise<string>`

Standardowa kompletacja tekstowa (non-stream).

```typescript
const response = await openrouter.complete({
  system: "Jesteś pomocnym asystentem IT",
  user: "Jak zresetować hasło w Windows?",
  params: {
    temperature: 0.3,
    max_tokens: 500,
  },
});

console.log(response); // "Aby zresetować hasło w Windows..."
```

#### `completeStructured<T>(input: CompleteStructuredInput<T>): Promise<T>`

Ustrukturyzowana odpowiedź zgodna z JSON Schema.

```typescript
interface TicketClassification {
  categoryId: string;
  subcategoryId: string;
  summary: string;
  priority: "low" | "medium" | "high";
}

const jsonSchema = {
  name: "ticket_classification",
  strict: true as const,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      categoryId: { type: "string" },
      subcategoryId: { type: "string" },
      summary: { type: "string" },
      priority: { type: "string", enum: ["low", "medium", "high"] },
    },
    required: ["categoryId", "subcategoryId", "summary", "priority"],
  },
};

const result = await openrouter.completeStructured<TicketClassification>({
  system: "Klasyfikuj zgłoszenia IT",
  user: "Komputer się nie włącza",
  jsonSchema,
  params: { temperature: 0.1 },
});

console.log(result);
// { categoryId: "hardware", subcategoryId: "computer", summary: "...", priority: "high" }
```

#### `stream(input: CompleteInput): Promise<ReadableStream<Uint8Array>>`

Streaming odpowiedzi (SSE) - do użycia w Route Handlers.

```typescript
const stream = await openrouter.stream({
  system: "Jesteś asystentem TickFlow",
  user: "Wyjaśnij mi VPN",
});

return new Response(stream, {
  headers: { "Content-Type": "text/event-stream" },
});
```

#### `getDefaultModel(): string`

Zwraca skonfigurowany domyślny model.

```typescript
const model = openrouter.getDefaultModel();
// "openai/gpt-4o-mini"
```

#### `getDefaultParams(): Record<string, unknown>`

Zwraca domyślne parametry modelu.

```typescript
const params = openrouter.getDefaultParams();
// { temperature: 0.2, max_tokens: 600 }
```

## Przykłady użycia

### Server Action - Klasyfikacja ticketu

```typescript
// app/actions/ai/complete.ts
"use server";
import { openrouter } from "@/app/lib/services/openrouter/server";

export async function classifyTicket(description: string) {
  const jsonSchema = {
    name: "ticket_guidance",
    strict: true as const,
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
  };

  return await openrouter.completeStructured({
    system: "Jesteś asystentem TickFlow. Klasyfikuj problemy IT.",
    user: description,
    jsonSchema,
    params: { temperature: 0.1 },
  });
}
```

### Route Handler - Streaming chat

```typescript
// app/api/ai/complete/route.ts
import { NextRequest } from "next/server";
import { openrouter } from "@/app/lib/services/openrouter/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

  const stream = await openrouter.stream({
    system: "Jesteś pomocnym asystentem TickFlow",
    user: prompt,
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" },
  });
}
```

### Klient UI - Odczyt strumienia

```typescript
// Przykład w komponencie React (Client Component)
const [response, setResponse] = useState("");

const handleStream = async () => {
  const res = await fetch("/api/ai/complete", {
    method: "POST",
    body: JSON.stringify({ prompt: "Czym jest VPN?" }),
  });

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let accumulated = "";

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;

    accumulated += decoder.decode(value, { stream: true });
    setResponse(accumulated);
  }
};
```

## Obsługa błędów

Serwis rzuca `OpenRouterError` z odpowiednimi kodami statusu:

```typescript
import { OpenRouterError } from "@/app/lib/services/openrouter/errors";

try {
  await openrouter.complete({ user: prompt });
} catch (error) {
  if (error instanceof OpenRouterError) {
    console.error(`Status: ${error.status}`);
    console.error(`Message: ${error.message}`);
    console.error(`Details:`, error.details);
    
    // Obsługa specyficznych błędów
    if (error.status === 401) {
      // Nieprawidłowy klucz API
    } else if (error.status === 429) {
      // Rate limit exceeded
    } else if (error.status === 408) {
      // Timeout
    }
  }
}
```

### Scenariusze błędów

| Kod | Opis | Działanie |
|-----|------|-----------|
| 401/403 | Błędny klucz API | Sprawdź `OPENROUTER_API_KEY` w `.env.local` |
| 429 | Rate limit | Automatyczne retry (2x), potem błąd |
| 5xx | Błąd dostawcy | Automatyczne retry (2x), potem błąd |
| 408 | Timeout | Przekroczono 30s, przerwij żądanie |
| 400 | Nieprawidłowe parametry | Sprawdź walidację Zod |

## Bezpieczeństwo

✅ **Klucz API tylko po stronie serwera** - wszystkie wywołania przez Server Actions lub Route Handlers

✅ **Rate limiting** - wykorzystanie `app/lib/middleware/rate-limiter.ts` (5 req/min)

✅ **Walidacja Zod** - wszystkie wejścia/wyjścia walidowane schematami

✅ **Limity długości** - max 4000 znaków promptu

✅ **Timeout** - 30s na żądanie

✅ **Retry z backoff** - 2 próby dla błędów przejściowych (250ms, 1s)

## Parametry modeli

### Podstawowe

```typescript
{
  temperature: 0.0-2.0,      // Kreatywność (0=deterministyczny, 2=bardzo kreatywny)
  max_tokens: number,        // Maks. długość odpowiedzi
  top_p: 0.0-1.0,           // Nucleus sampling
  frequency_penalty: 0.0-2.0, // Kara za powtórzenia
  presence_penalty: 0.0-2.0,  // Kara za używane tematy
}
```

### Rekomendacje dla przypadków użycia

```typescript
// Klasyfikacja/kategoryzacja (deterministyczna)
{ temperature: 0.1, max_tokens: 300 }

// Odpowiedzi pomocnicze (zbalansowane)
{ temperature: 0.3, max_tokens: 600 }

// Kreatywne teksty (elastyczne)
{ temperature: 0.7, max_tokens: 1000 }
```

## Testowanie

### Przykładowy test jednostkowy

```typescript
import { createOpenRouterService } from "@/app/lib/services/openrouter";

describe("OpenRouter Service", () => {
  const service = createOpenRouterService({
    apiKey: process.env.OPENROUTER_API_KEY!,
    defaultModel: "openai/gpt-4o-mini",
  });

  it("should complete text prompt", async () => {
    const response = await service.complete({
      user: "Say hello in Polish",
    });
    
    expect(response).toContain("Cześć");
  });

  it("should handle structured output", async () => {
    const result = await service.completeStructured({
      user: "Classify: printer not working",
      jsonSchema: {
        name: "classification",
        strict: true,
        schema: {
          type: "object",
          properties: {
            category: { type: "string" },
          },
          required: ["category"],
        },
      },
    });
    
    expect(result).toHaveProperty("category");
  });
});
```

## Troubleshooting

### Problem: "OPENROUTER_API_KEY nie jest zdefiniowany"

**Rozwiązanie:** Dodaj klucz do `.env.local`:
```dotenv
OPENROUTER_API_KEY=sk-or-v1-...
```

### Problem: Rate limit 429

**Rozwiązanie:** Poczekaj na reset (info w `error.details`) lub zwiększ limit w `rate-limiter.ts`

### Problem: Timeout 408

**Rozwiązanie:** 
- Zmniejsz `max_tokens`
- Zwiększ `timeoutMs` w konfiguracji
- Użyj szybszego modelu (`gpt-4o-mini`)

### Problem: Nieprawidłowy JSON w structured response

**Rozwiązanie:**
- Upewnij się, że `strict: true` w JSON Schema
- Dodaj wszystkie pola do `required`
- Użyj `additionalProperties: false`

## Linki

- [OpenRouter API Docs](https://openrouter.ai/docs)
- [OpenRouter Models](https://openrouter.ai/models)
- [JSON Schema Spec](https://json-schema.org/)

