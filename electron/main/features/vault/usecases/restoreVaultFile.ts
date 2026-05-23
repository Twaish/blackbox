export default class RestoreVaultFile {
  constructor(private readonly manager: IVaultManager) {}

  async execute(args: {
    vaultId: string
    fileId: string
    outputFilepath: string
  }) {
    return this.manager.restoreFile(args)
  }
}
