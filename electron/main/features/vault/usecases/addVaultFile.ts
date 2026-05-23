export default class AddVaultFile {
  constructor(private readonly manager: IVaultManager) {}

  async execute(args: { vaultId: string; filepath: string }) {
    return this.manager.addFile(args)
  }
}
