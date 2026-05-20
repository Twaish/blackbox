import z from 'zod'

export const namespaceSchema = z.string()

export const settingsSchema = z.record(z.string(), z.unknown())

export const getInputSchema = z.object({
  namespace: z.string(),
  key: z.string(),
})

export const setInputSchema = z.object({
  namespace: z.string(),
  key: z.string(),
  value: z.unknown(),
})
