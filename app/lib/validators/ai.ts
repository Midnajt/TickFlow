import * as z from "zod";

/**
 * Schemat parametrów modelu AI
 */
export const ModelParamsSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().positive().optional(),
  top_p: z.number().min(0).max(1).optional(),
  frequency_penalty: z.number().min(0).max(2).optional(),
  presence_penalty: z.number().min(0).max(2).optional(),
}).strict();

export type ModelParams = z.infer<typeof ModelParamsSchema>;

/**
 * Schemat wejścia dla standardowej kompletacji
 */
export const CompleteInputSchema = z.object({
  system: z.string().min(1).optional(),
  user: z.string().min(1).max(4000, "Prompt nie może przekraczać 4000 znaków"),
  model: z.string().min(1).optional(),
  params: ModelParamsSchema.optional(),
});

export type CompleteInput = z.infer<typeof CompleteInputSchema>;

/**
 * Typ odpowiedzi tekstowej z LLM
 */
export type LLMText = string;

/**
 * Schemat JSON Schema dla ustrukturyzowanych odpowiedzi
 */
export const JsonSchemaSchema = z.object({
  name: z.string().min(1),
  strict: z.boolean(),
  schema: z.any(), // JSON Schema może być dowolnym obiektem
});

export type JsonSchema = z.infer<typeof JsonSchemaSchema>;

/**
 * Schemat wejścia dla ustrukturyzowanej kompletacji
 */
export const CompleteStructuredInputSchema = z.object({
  system: z.string().min(1).optional(),
  user: z.string().min(1).max(4000, "Prompt nie może przekraczać 4000 znaków"),
  model: z.string().min(1).optional(),
  params: ModelParamsSchema.optional(),
  jsonSchema: JsonSchemaSchema,
});

export type CompleteStructuredInput<T = unknown> = z.infer<typeof CompleteStructuredInputSchema> & { _type?: T };

