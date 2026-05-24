export default class RestoreAllVaultFiles {
  constructor(private readonly manager: IVaultManager) {}

  async execute(args: { vaultId: string; outputDir: string }) {
    return this.manager.restoreAllFiles(args)
  }
}
