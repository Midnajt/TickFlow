"use server";

import * as z from "zod";
import { openrouter } from "@/app/lib/services/openrouter/server";
import { CategoryService } from "@/app/lib/services/categories";
import { AgentCategoryService } from "@/app/lib/services/agent-categories";

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
  suggestedAgents: Array<{
    name: string;
    email: string;
  }>;
}

/**
 * Buduje dynamiczny system prompt z aktualnymi kategoriami, podkategoriami i agentami
 * @returns Sformatowany prompt systemowy dla AI
 */
async function buildSystemPrompt(): Promise<string> {
  // Pobierz wszystkie kategorie z podkategoriami i opisami
  const { categories } = await CategoryService.getCategories(true);

  // Zbuduj podstawowy prompt
  let prompt = `Jesteś asystentem TickFlow - systemu zgłoszeń IT.
Twoim zadaniem jest analiza problemu użytkownika i:
1. Zaklasyfikowanie go do właściwej kategorii i podkategorii
2. Stworzenie zwięzłego podsumowania problemu
3. Zasugerowanie kroków rozwiązania
4. Wskazanie agentów, którzy będą obsługiwać zgłoszenie

Dostępne kategorie, podkategorie i przypisani agenci:

`;

  // Dla każdej kategorii pobierz agentów i zbuduj szczegółowy opis
  for (const category of categories) {
    const categoryDesc = category.description ? ` - ${category.description}` : '';
    prompt += `- Kategoria: ${category.name} (ID: "${category.id}")${categoryDesc}\n`;

    // Pobierz agentów dla tej kategorii
    try {
      const { agents } = await AgentCategoryService.getAgentsByCategory(category.id);
      if (agents.length > 0) {
        const agentsList = agents.map(a => `${a.name} (${a.email})`).join(', ');
        prompt += `  Agenci obsługujący tę kategorię: ${agentsList}\n`;
      } else {
        prompt += `  Agenci obsługujący tę kategorię: Brak przypisanych agentów\n`;
      }
    } catch (error) {
      prompt += `  Agenci obsługujący tę kategorię: Brak informacji\n`;
    }

    // Dodaj podkategorie
    if (category.subcategories.length > 0) {
      prompt += `  Podkategorie:\n`;
      for (const sub of category.subcategories) {
        const subDesc = sub.description ? ` - ${sub.description}` : '';
        prompt += `    • ${sub.name} (ID: "${sub.id}")${subDesc}\n`;
      }
    }
    prompt += '\n';
  }

  prompt += `\nOdpowiadaj zawsze w języku polskim.`;

  return prompt;
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

  // Pobierz dynamiczny system prompt z aktualnymi danymi z bazy
  const system = await buildSystemPrompt();

  // Prompt dla AI z instrukcją zwrócenia JSON
  const aiPrompt = `${description}

Przeanalizuj powyższy opis problemu i zwróć odpowiedź w formacie JSON:

{
  "categoryId": "ID wybranej kategorii (np. 'hardware', 'software' itp.)",
  "subcategoryId": "ID wybranej podkategorii",
  "summary": "zwięzłe podsumowanie problemu (max 200 znaków)",
  "suggestedSteps": ["krok 1", "krok 2", "krok 3"],
  "suggestedAgents": [
    {"name": "Imię i nazwisko agenta", "email": "email@example.com"},
    {"name": "Inny agent", "email": "agent@example.com"}
  ]
}

WAŻNE: W polu suggestedAgents zwróć TYLKO tych agentów, którzy są przypisani do wybranej kategorii (zgodnie z informacją "Agenci obsługujący tę kategorię" podaną wyżej).

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

