"use server";

import * as z from "zod";
import { openrouter } from "@/app/lib/services/openrouter/server";

/**
 * Schemat wejścia do AI completion
 */
const CompleteAiInputSchema = z.object({
  description: z.string().min(10, "Opis musi mieć minimum 10 znaków").max(4000),
});

/**
 * Typ odpowiedzi AI z klasyfikacją ticketu
 */
export interface TicketGuidance {
  categoryId: string;
  subcategoryId: string;
  summary: string;
  suggestedSteps: string[];
}

/**
 * Server Action: Klasyfikacja i sugestie dla nowego ticketu
 * 
 * Używa OpenRouter z ustrukturyzowaną odpowiedzią (JSON Schema)
 * do automatycznej klasyfikacji problemu i sugestii kroków rozwiązania.
 * 
 * @param formData - FormData z opisem problemu
 * @returns Ustrukturyzowane dane: kategoria, podkategoria, podsumowanie i sugerowane kroki
 */
export async function completeAi(formData: FormData): Promise<TicketGuidance> {
  // Walidacja wejścia
  const { description } = CompleteAiInputSchema.parse({
    description: formData.get("description"),
  });

  // Komunikat systemowy definiujący rolę AI
  const system = `Jesteś asystentem TickFlow - systemu zgłoszeń IT.
Twoim zadaniem jest analiza problemu użytkownika i:
1. Zaklasyfikowanie go do właściwej kategorii i podkategorii
2. Stworzenie zwięzłego podsumowania problemu
3. Zasugerowanie kroków rozwiązania

Dostępne kategorie i podkategorie:
- Hardware (categoryId: "hardware")
  - Komputer (subcategoryId: "computer")
  - Drukarka (subcategoryId: "printer")
  - Monitor (subcategoryId: "monitor")
  - Inne urządzenia (subcategoryId: "other-hardware")
- Software (categoryId: "software")
  - System operacyjny (subcategoryId: "os")
  - Aplikacje (subcategoryId: "apps")
  - Licencje (subcategoryId: "licenses")
- Sieć (categoryId: "network")
  - Internet (subcategoryId: "internet")
  - VPN (subcategoryId: "vpn")
  - Wi-Fi (subcategoryId: "wifi")
- Konta i dostępy (categoryId: "accounts")
  - Hasła (subcategoryId: "passwords")
  - Uprawnienia (subcategoryId: "permissions")
  - Nowe konto (subcategoryId: "new-account")

Odpowiadaj zawsze w języku polskim.`;

  // Prompt dla AI z instrukcją zwrócenia JSON
  const aiPrompt = `${description}

Przeanalizuj powyższy opis problemu i zwróć odpowiedź w formacie JSON:

{
  "categoryId": "jedno z: hardware, software, network, accounts",
  "subcategoryId": "odpowiednie ID podkategorii",
  "summary": "zwięzłe podsumowanie problemu (max 200 znaków)",
  "suggestedSteps": ["krok 1", "krok 2", "krok 3"]
}

Odpowiedz TYLKO prawidłowym JSON bez żadnego dodatkowego tekstu.`;

  // Wywołanie OpenRouter z zwykłą odpowiedzią tekstową
  const response = await openrouter.complete({
    system,
    user: aiPrompt,
    params: {
      temperature: 0.1, // Niska temperatura dla spójnych klasyfikacji
      max_tokens: 500,
    },
  });

  // Parsowanie odpowiedzi JSON
  try {
    const parsed = JSON.parse(response);
    return parsed as TicketGuidance;
  } catch (error) {
    throw new Error(`AI zwróciła nieprawidłową odpowiedź JSON: ${response}`);
  }
}

/**
 * Server Action: Prosta kompletacja tekstowa AI
 * 
 * Używa OpenRouter do odpowiedzi na pytanie użytkownika w kontekście TickFlow.
 * 
 * @param prompt - Pytanie/prompt użytkownika
 * @returns Tekstowa odpowiedź AI
 */
export async function askAi(prompt: string): Promise<string> {
  // Walidacja
  const validPrompt = z
    .string()
    .min(1, "Prompt nie może być pusty")
    .max(4000)
    .parse(prompt);

  const system = `Jesteś pomocnym asystentem TickFlow - systemu zgłoszeń IT.
Odpowiadaj zwięźle i konkretnie na pytania użytkownika.
Jeśli pytanie dotyczy problemów technicznych, sugeruj utworzenie ticketu.
Odpowiadaj zawsze w języku polskim.`;

  return await openrouter.complete({
    system,
    user: validPrompt,
    params: {
      temperature: 0.3,
      max_tokens: 600,
    },
  });
}

