import { NextRequest, NextResponse } from "next/server";
import * as z from "zod";
import { openrouter } from "@/app/lib/services/openrouter/server";
import { checkRateLimit } from "@/app/lib/middleware/rate-limiter";

/**
 * Runtime konfiguracja - Node.js dla streamingu
 */
export const runtime = "nodejs";

/**
 * Schemat body dla POST /api/ai/complete
 */
const BodySchema = z.object({
  prompt: z.string().min(1, "Prompt nie może być pusty").max(4000),
  model: z.string().optional(),
  system: z.string().optional(),
  params: z
    .object({
      temperature: z.number().min(0).max(2).optional(),
      max_tokens: z.number().int().positive().optional(),
      top_p: z.number().min(0).max(1).optional(),
    })
    .optional(),
});

/**
 * POST /api/ai/complete
 * 
 * Endpoint ze streamingiem (SSE) odpowiedzi z OpenRouter.
 * Idealny do real-time UI z progressywnym renderowaniem odpowiedzi.
 * 
 * Rate limit: 5 żądań na minutę na IP (konfiguracja w rate-limiter.ts)
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limiting - wykorzystanie istniejącego mechanizmu
    const rateLimitError = checkRateLimit(req);
    if (rateLimitError) {
      return rateLimitError;
    }

    // Parsowanie i walidacja body
    const body = await req.json();
    const { prompt, model, system, params } = BodySchema.parse(body);

    // Domyślny komunikat systemowy
    const systemMessage =
      system ??
      `Jesteś pomocnym asystentem TickFlow - systemu zgłoszeń IT.
Odpowiadaj zwięźle, pomocnie i w języku polskim.`;

    // Wywołanie streamingu z OpenRouter
    const stream = await openrouter.stream({
      system: systemMessage,
      user: prompt,
      model,
      params,
    });

    // Zwrot strumienia do klienta jako text/event-stream
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    // Obsługa błędów walidacji Zod
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Nieprawidłowe dane wejściowe",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    // Obsługa błędów OpenRouter
    if (error instanceof Error && error.name === "OpenRouterError") {
      const orError = error as { status?: number; details?: unknown };
      return NextResponse.json(
        {
          error: error.message,
          details: orError.details,
        },
        { status: orError.status ?? 500 }
      );
    }

    // Ogólny błąd serwera
    console.error("Błąd AI completion endpoint:", error);
    return NextResponse.json(
      {
        error: "Wystąpił błąd podczas przetwarzania żądania",
      },
      { status: 500 }
    );
  }
}

