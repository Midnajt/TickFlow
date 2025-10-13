"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { completeAi, askAi } from "@/app/actions/ai/complete";

/**
 * Przykładowy komponent demonstrujący użycie OpenRouter Service
 * 
 * Pokazuje dwa przypadki użycia:
 * 1. Ustrukturyzowana klasyfikacja ticketu (completeStructured)
 * 2. Prosta odpowiedź tekstowa (complete)
 */
export function AiExampleComponent() {
  const [description, setDescription] = useState("");
  const [classification, setClassification] = useState<{
    categoryId: string;
    subcategoryId: string;
    summary: string;
    suggestedSteps: string[];
  } | null>(null);
  const [textResponse, setTextResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Przykład 1: Klasyfikacja ticketu (structured)
   */
  const handleClassify = async () => {
    if (!description.trim()) return;

    setIsLoading(true);
    setError(null);
    setClassification(null);

    try {
      const formData = new FormData();
      formData.append("description", description);

      const result = await completeAi(formData);
      setClassification(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Przykład 2: Proste pytanie (text)
   */
  const handleAsk = async () => {
    if (!description.trim()) return;

    setIsLoading(true);
    setError(null);
    setTextResponse("");

    try {
      const response = await askAi(description);
      setTextResponse(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Przykład 3: Streaming (przez fetch do API)
   */
  const handleStream = async () => {
    if (!description.trim()) return;

    setIsLoading(true);
    setError(null);
    setTextResponse("");

    try {
      const response = await fetch("/api/ai/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: description }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;

        accumulated += decoder.decode(value, { stream: true });
        setTextResponse(accumulated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">
          OpenRouter Service - Przykłady użycia
        </h2>

        {/* Formularz wejściowy */}
        <div className="space-y-4">
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium mb-2"
            >
              Opis problemu lub pytanie
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="np. Nie działa drukarka HP LaserJet..."
              className="w-full min-h-[100px] p-3 border rounded-md"
              disabled={isLoading}
            />
          </div>

          {/* Przyciski akcji */}
          <div className="flex gap-3">
            <Button
              onClick={handleClassify}
              disabled={isLoading || !description.trim()}
            >
              {isLoading ? "Klasyfikuję..." : "Klasyfikuj ticket (structured)"}
            </Button>

            <Button
              onClick={handleAsk}
              disabled={isLoading || !description.trim()}
              variant="outline"
            >
              {isLoading ? "Odpowiadam..." : "Zapytaj AI (text)"}
            </Button>

            <Button
              onClick={handleStream}
              disabled={isLoading || !description.trim()}
              variant="outline"
            >
              {isLoading ? "Strumieniuję..." : "Stream odpowiedzi"}
            </Button>
          </div>
        </div>

        {/* Wyświetlanie błędów */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 font-medium">Błąd:</p>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Wynik klasyfikacji */}
        {classification && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="font-bold text-green-900 mb-3">
              Klasyfikacja ticketu:
            </h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Kategoria:</span>{" "}
                {classification.categoryId}
              </p>
              <p>
                <span className="font-medium">Podkategoria:</span>{" "}
                {classification.subcategoryId}
              </p>
              <p>
                <span className="font-medium">Podsumowanie:</span>{" "}
                {classification.summary}
              </p>
              <div>
                <p className="font-medium mb-1">Sugerowane kroki:</p>
                <ol className="list-decimal list-inside space-y-1">
                  {classification.suggestedSteps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Wynik tekstowy */}
        {textResponse && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="font-bold text-blue-900 mb-3">Odpowiedź AI:</h3>
            <p className="text-blue-800 whitespace-pre-wrap">{textResponse}</p>
          </div>
        )}
      </Card>

      {/* Dokumentacja inline */}
      <Card className="p-6 bg-gray-50">
        <h3 className="font-bold mb-3">Informacje dla deweloperów:</h3>
        <div className="text-sm space-y-2 text-gray-700">
          <p>
            <strong>Server Action (structured):</strong> Używa{" "}
            <code>completeStructured()</code> z JSON Schema do uzyskania
            ustrukturyzowanej odpowiedzi. Idealny do klasyfikacji, ekstrakcji
            danych, formularzy.
          </p>
          <p>
            <strong>Server Action (text):</strong> Używa <code>complete()</code>{" "}
            do prostej odpowiedzi tekstowej. Szybki i prosty.
          </p>
          <p>
            <strong>API Endpoint (stream):</strong> Wykorzystuje{" "}
            <code>stream()</code> przez <code>/api/ai/complete</code> do
            real-time odpowiedzi. Najlepszy UX dla dłuższych odpowiedzi.
          </p>
          <p className="mt-4">
            <strong>Rate limit:</strong> 5 żądań/minutę na IP
          </p>
          <p>
            <strong>Timeout:</strong> 30 sekund
          </p>
          <p>
            <strong>Model:</strong> openai/gpt-4o-mini (szybki i tani)
          </p>
        </div>
      </Card>
    </div>
  );
}

