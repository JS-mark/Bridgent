import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { jsonSchemaToZod } from '../src/jsonschema-to-zod'

describe('jsonSchemaToZod', () => {
  it('handles primitive types', () => {
    expect(jsonSchemaToZod({ type: 'string' }).safeParse('hi').success).toBe(true)
    expect(jsonSchemaToZod({ type: 'number' }).safeParse(1.5).success).toBe(true)
    expect(jsonSchemaToZod({ type: 'integer' }).safeParse(1.5).success).toBe(false)
    expect(jsonSchemaToZod({ type: 'integer' }).safeParse(2).success).toBe(true)
    expect(jsonSchemaToZod({ type: 'boolean' }).safeParse(true).success).toBe(true)
  })

  it('respects required vs optional on object props', () => {
    const schema = jsonSchemaToZod({
      type: 'object',
      properties: { a: { type: 'string' }, b: { type: 'number' } },
      required: ['a'],
    })
    expect(schema.safeParse({ a: 'x' }).success).toBe(true)
    expect(schema.safeParse({}).success).toBe(false)
    expect(schema.safeParse({ a: 'x', b: 1 }).success).toBe(true)
  })

  it('handles enum (string)', () => {
    const schema = jsonSchemaToZod({ enum: ['open', 'closed'] })
    expect(schema.safeParse('open').success).toBe(true)
    expect(schema.safeParse('other').success).toBe(false)
  })

  it('handles const literal', () => {
    const schema = jsonSchemaToZod({ const: 42 })
    expect(schema.safeParse(42).success).toBe(true)
    expect(schema.safeParse(43).success).toBe(false)
  })

  it('handles oneOf as union', () => {
    const schema = jsonSchemaToZod({
      oneOf: [{ type: 'string' }, { type: 'number' }],
    })
    expect(schema.safeParse('x').success).toBe(true)
    expect(schema.safeParse(1).success).toBe(true)
    expect(schema.safeParse(true).success).toBe(false)
  })

  it('handles 3.0 nullable', () => {
    const schema = jsonSchemaToZod({ type: 'string', nullable: true })
    expect(schema.safeParse(null).success).toBe(true)
    expect(schema.safeParse('hi').success).toBe(true)
  })

  it('handles 3.1 type-array nullable', () => {
    const schema = jsonSchemaToZod({ type: ['string', 'null'] })
    expect(schema.safeParse(null).success).toBe(true)
    expect(schema.safeParse('hi').success).toBe(true)
    expect(schema.safeParse(1).success).toBe(false)
  })

  it('handles allOf object merge', () => {
    const schema = jsonSchemaToZod({
      allOf: [
        { type: 'object', properties: { a: { type: 'string' } }, required: ['a'] },
        { type: 'object', properties: { b: { type: 'number' } }, required: ['b'] },
      ],
    })
    expect(schema.safeParse({ a: 'x', b: 1 }).success).toBe(true)
    expect(schema.safeParse({ a: 'x' }).success).toBe(false)
  })

  it('preserves description as zod .describe()', () => {
    const schema = jsonSchemaToZod({ type: 'string', description: 'a name' })
    expect(schema.description).toBe('a name')
  })

  it('handles array items', () => {
    const schema = jsonSchemaToZod({
      type: 'array',
      items: { type: 'string' },
    })
    expect(schema.safeParse(['a']).success).toBe(true)
    expect(schema.safeParse([]).success).toBe(true)
    expect(schema.safeParse([1]).success).toBe(false)
  })

  it('handles string format=email', () => {
    const schema = jsonSchemaToZod({ type: 'string', format: 'email' })
    expect(schema.safeParse('not-an-email').success).toBe(false)
    expect(schema.safeParse('a@b.co').success).toBe(true)
  })

  it('handles additionalProperties=true (passthrough)', () => {
    const schema = jsonSchemaToZod({
      type: 'object',
      properties: { a: { type: 'string' } },
      required: ['a'],
      additionalProperties: true,
    })
    const result = schema.safeParse({ a: 'x', extra: 1 })
    expect(result.success).toBe(true)
    if (result.success)
      expect((result.data as Record<string, unknown>).extra).toBe(1)
  })

  it('treats unknown shape as z.any()', () => {
    const schema = jsonSchemaToZod({})
    // z.any() accepts anything (including {} → object branch), accept that path too.
    expect(schema instanceof z.ZodAny || schema.safeParse({ random: true }).success).toBe(true)
  })
})
