export default class DeleteVaultFile {
  constructor(private readonly manager: IVaultManager) {}

  async execute(args: { vaultId: string; fileId: string }) {
    return this.manager.deleteFile(args)
  }
}
