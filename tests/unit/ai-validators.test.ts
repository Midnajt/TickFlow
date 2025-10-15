import { describe, it, expect } from 'vitest'
import {
  ModelParamsSchema,
  CompleteInputSchema,
  JsonSchemaSchema,
  CompleteStructuredInputSchema
} from '@/app/lib/validators/ai'

describe('AI Validators', () => {
  describe('ModelParamsSchema', () => {
    it('should validate valid model parameters', () => {
      const validData = {
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.9,
        frequency_penalty: 0.5,
        presence_penalty: 0.5
      }

      const result = ModelParamsSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept empty object (all params optional)', () => {
      const result = ModelParamsSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should accept partial parameters', () => {
      const validData = {
        temperature: 0.5,
        max_tokens: 500
      }

      const result = ModelParamsSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject temperature below 0', () => {
      const invalidData = {
        temperature: -0.1
      }

      const result = ModelParamsSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject temperature above 2', () => {
      const invalidData = {
        temperature: 2.1
      }

      const result = ModelParamsSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject non-positive max_tokens', () => {
      const invalidData = {
        max_tokens: 0
      }

      const result = ModelParamsSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject negative max_tokens', () => {
      const invalidData = {
        max_tokens: -100
      }

      const result = ModelParamsSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject non-integer max_tokens', () => {
      const invalidData = {
        max_tokens: 100.5
      }

      const result = ModelParamsSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject top_p below 0', () => {
      const invalidData = {
        top_p: -0.1
      }

      const result = ModelParamsSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject top_p above 1', () => {
      const invalidData = {
        top_p: 1.1
      }

      const result = ModelParamsSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject frequency_penalty below 0', () => {
      const invalidData = {
        frequency_penalty: -0.1
      }

      const result = ModelParamsSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject frequency_penalty above 2', () => {
      const invalidData = {
        frequency_penalty: 2.1
      }

      const result = ModelParamsSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject presence_penalty below 0', () => {
      const invalidData = {
        presence_penalty: -0.1
      }

      const result = ModelParamsSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject presence_penalty above 2', () => {
      const invalidData = {
        presence_penalty: 2.1
      }

      const result = ModelParamsSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject unknown properties (strict mode)', () => {
      const invalidData = {
        temperature: 0.7,
        unknown_param: 'value'
      }

      const result = ModelParamsSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept boundary values for temperature (0 and 2)', () => {
      const minData = { temperature: 0 }
      const maxData = { temperature: 2 }

      expect(ModelParamsSchema.safeParse(minData).success).toBe(true)
      expect(ModelParamsSchema.safeParse(maxData).success).toBe(true)
    })

    it('should accept boundary values for top_p (0 and 1)', () => {
      const minData = { top_p: 0 }
      const maxData = { top_p: 1 }

      expect(ModelParamsSchema.safeParse(minData).success).toBe(true)
      expect(ModelParamsSchema.safeParse(maxData).success).toBe(true)
    })
  })

  describe('CompleteInputSchema', () => {
    it('should validate valid input with all fields', () => {
      const validData = {
        system: 'You are a helpful assistant',
        user: 'Hello, how are you?',
        model: 'gpt-4',
        params: {
          temperature: 0.7,
          max_tokens: 1000
        }
      }

      const result = CompleteInputSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate with only required user field', () => {
      const validData = {
        user: 'Hello!'
      }

      const result = CompleteInputSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate with user and system fields', () => {
      const validData = {
        system: 'You are a helpful assistant',
        user: 'Hello!'
      }

      const result = CompleteInputSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject empty user prompt', () => {
      const invalidData = {
        user: ''
      }

      const result = CompleteInputSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject user prompt exceeding 4000 characters', () => {
      const invalidData = {
        user: 'a'.repeat(4001)
      }

      const result = CompleteInputSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('4000')
      }
    })

    it('should accept user prompt at exactly 4000 characters', () => {
      const validData = {
        user: 'a'.repeat(4000)
      }

      const result = CompleteInputSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject empty system prompt if provided', () => {
      const invalidData = {
        system: '',
        user: 'Hello!'
      }

      const result = CompleteInputSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject empty model if provided', () => {
      const invalidData = {
        user: 'Hello!',
        model: ''
      }

      const result = CompleteInputSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject missing user field', () => {
      const invalidData = {
        system: 'You are a helpful assistant'
      }

      const result = CompleteInputSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should validate nested params schema', () => {
      const invalidData = {
        user: 'Hello!',
        params: {
          temperature: 3.0 // Invalid: above 2
        }
      }

      const result = CompleteInputSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('JsonSchemaSchema', () => {
    it('should validate valid JSON schema definition', () => {
      const validData = {
        name: 'TicketSuggestion',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            categoryId: { type: 'string' },
            subcategoryId: { type: 'string' }
          }
        }
      }

      const result = JsonSchemaSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject empty name', () => {
      const invalidData = {
        name: '',
        strict: true,
        schema: {}
      }

      const result = JsonSchemaSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should require strict field', () => {
      const invalidData = {
        name: 'Test',
        schema: {}
      }

      const result = JsonSchemaSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should require schema field', () => {
      const invalidData = {
        name: 'Test',
        strict: true
      }

      const result = JsonSchemaSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept any schema object', () => {
      const validData = {
        name: 'Test',
        strict: false,
        schema: {
          complex: {
            nested: {
              structure: [1, 2, 3]
            }
          }
        }
      }

      const result = JsonSchemaSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('CompleteStructuredInputSchema', () => {
    it('should validate valid structured input', () => {
      const validData = {
        system: 'You are a helpful assistant',
        user: 'Categorize this ticket',
        model: 'gpt-4',
        params: {
          temperature: 0.7
        },
        jsonSchema: {
          name: 'TicketCategory',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              categoryId: { type: 'string' }
            }
          }
        }
      }

      const result = CompleteStructuredInputSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate with minimal required fields', () => {
      const validData = {
        user: 'Hello!',
        jsonSchema: {
          name: 'Response',
          strict: true,
          schema: {}
        }
      }

      const result = CompleteStructuredInputSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should require jsonSchema field', () => {
      const invalidData = {
        user: 'Hello!'
      }

      const result = CompleteStructuredInputSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject empty user prompt', () => {
      const invalidData = {
        user: '',
        jsonSchema: {
          name: 'Test',
          strict: true,
          schema: {}
        }
      }

      const result = CompleteStructuredInputSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject user prompt exceeding 4000 characters', () => {
      const invalidData = {
        user: 'a'.repeat(4001),
        jsonSchema: {
          name: 'Test',
          strict: true,
          schema: {}
        }
      }

      const result = CompleteStructuredInputSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should validate nested schemas properly', () => {
      const invalidData = {
        user: 'Hello!',
        params: {
          temperature: 3.0 // Invalid
        },
        jsonSchema: {
          name: 'Test',
          strict: true,
          schema: {}
        }
      }

      const result = CompleteStructuredInputSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should validate complete real-world example', () => {
      const validData = {
        system: 'You are an AI assistant that categorizes IT support tickets.',
        user: 'My laptop screen is broken and won\'t turn on',
        model: 'gpt-4o-mini',
        params: {
          temperature: 0.3,
          max_tokens: 500,
          top_p: 1.0
        },
        jsonSchema: {
          name: 'TicketCategorization',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              categoryId: { type: 'string' },
              subcategoryId: { type: 'string' },
              title: { type: 'string' },
              reasoning: { type: 'string' }
            },
            required: ['categoryId', 'subcategoryId', 'title']
          }
        }
      }

      const result = CompleteStructuredInputSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })
})

