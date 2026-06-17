import z from 'zod'

export const nameOutputSchema = z.string()

export const versionOutputSchema = z.string()

export const openFolderInputSchema = z.string()

export const selectFolderOutputSchema = z.string().nullable()

export const saveFileInputSchema = z.string()

export const selectFileOutputSchema = z.string().nullable()

export const selectFilesOutputSchema = z.array(z.string()).nullable()

const UpdateInfoSchema = z.unknown()
export const updateStatusSchema = z.discriminatedUnion('state', [
  z.object({
    state: z.literal('idle'),
  }),

  z.object({
    state: z.literal('checking'),
  }),

  z.object({
    state: z.literal('available'),
    info: UpdateInfoSchema,
  }),

  z.object({
    state: z.literal('not-available'),
  }),

  z.object({
    state: z.literal('downloading'),
  }),

  z.object({
    state: z.literal('downloaded'),
    info: UpdateInfoSchema,
  }),

  z.object({
    state: z.literal('error'),
    message: z.string(),
  }),
])
