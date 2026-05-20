interface IVaultReader {
  readFile({ filepath, passkey }: { filepath: string, passkey: string }): Blob
}