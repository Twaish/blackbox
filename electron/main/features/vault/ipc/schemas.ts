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

export const getOutputSchema = z.array(vaultEntrySchema)

export const vaultExistsOutputSchema = z.boolean()

export const changeLocationInputSchema = z.object({
  vaultId: vaultIdSchema,
  location: pathSchema,
})

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

export const deleteFilesInputSchema = z.object({
  vaultId: vaultIdSchema,
  fileIds: z.array(fileIdSchema),
})

export const restoreFileSchema = vaultFileSchema.extend({
  outputFilepath: z.string(),
})
export const restoreFilesInputSchema = z.object({
  vaultId: vaultIdSchema,
  fileIds: z.array(fileIdSchema),
  outputDir: pathSchema,
})
export const restoreAllFilesInputSchema = z.object({
  vaultId: vaultIdSchema,
  outputDir: pathSchema,
})

export const getFilesInputSchema = z.object({
  vaultId: vaultIdSchema,
  query: z.string().optional(),
})
export const getFilesOutputSchema = z.array(fileIdSchema)

export const unlockInputSchema = z.object({
  vaultId: vaultIdSchema,
  passphrase: passphraseSchema,
})

export const changePassphraseInputSchema = z.object({
  vaultId: vaultIdSchema,
  oldPassphrase: passphraseSchema,
  newPassphrase: passphraseSchema,
})
