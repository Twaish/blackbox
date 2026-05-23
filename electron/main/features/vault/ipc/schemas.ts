import z from 'zod'

export const passphraseSchema = z.string()
export const vaultIdSchema = z.string()
export const fileIdSchema = z.string()
export const pathSchema = z.string()

export const vaultEntrySchema = z.object({
  id: vaultIdSchema,
  name: z.string(),
  location: pathSchema,
})

export const vaultFileMetaSchema: z.ZodType<VaultFileMeta> = z.object({
  fileId: fileIdSchema,
  original: z.object({
    name: z.string(),
    ext: z.string(),
    mime: z.string(),
  }),
})

export const vaultFileSchema = z.object({
  vaultId: vaultIdSchema,
  fileId: fileIdSchema,
})

const uploadEvent = z.object({
  uploadId: z.string(),
})

export const startedEventSchema = uploadEvent.extend({
  filename: z.string(),
  total: z.number().optional(),
})

export const progressEventSchema = uploadEvent.extend({
  transferred: z.number(),
  total: z.number().optional(),
  percent: z.number().optional(),
})

export const finishedEventSchema = uploadEvent.extend({
  fileId: fileIdSchema,
})

export const abortedEventSchema = uploadEvent

export const getOutputSchema = z.array(vaultEntrySchema)

export const createInputSchema = z.object({
  location: z.string(),
  name: z.string(),
  passphrase: passphraseSchema,
})

export const renameInputSchema = z.object({
  vaultId: vaultIdSchema,
  name: z.string(),
})

export const addFileInputSchema = z.object({
  vaultId: vaultIdSchema,
  filepath: pathSchema,
})

export const restoreFileSchema = vaultFileSchema.extend({
  outputFilepath: z.string(),
})

export const getFilesOutputSchema = z.array(fileIdSchema)

export const unlockInputSchema = z.object({
  vaultId: vaultIdSchema,
  passphrase: passphraseSchema,
})
