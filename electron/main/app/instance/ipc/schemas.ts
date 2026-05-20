import z from 'zod'

export const nameOutputSchema = z.string()

export const versionOutputSchema = z.string()

export const openFolderInputSchema = z.string()

export const selectFolderOutputSchema = z.string().nullable()

export const saveFileInputSchema = z.string()

export const selectFileOutputSchema = z.string().nullable()
