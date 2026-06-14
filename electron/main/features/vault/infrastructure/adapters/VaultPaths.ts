import path from 'path'

export class VaultPaths implements IVaultPaths {
  data(vaultPath: string, fileId?: string) {
    return fileId
      ? path.join(vaultPath, 'data', `${fileId}.enc`)
      : path.join(vaultPath, 'data')
  }
  meta(vaultPath: string, fileId?: string) {
    return fileId
      ? path.join(vaultPath, 'meta', `${fileId}.enc`)
      : path.join(vaultPath, 'meta')
  }
  manifest(vaultPath: string) {
    return path.join(vaultPath, 'manifest.json')
  }
}
