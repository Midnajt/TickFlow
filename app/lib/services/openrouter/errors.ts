/**
 * Klasa błędu OpenRouter z kodem statusu HTTP
 */
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}

