export default class RestoreVaultFiles {
  constructor(private readonly manager: IVaultManager) {}

  async execute(args: {
    vaultId: string
    fileIds: string[]
    outputDir: string
  }) {
    return this.manager.restoreFiles(args)
  }
}
