export default class ReadVaultFileMeta {
  constructor(private readonly manager: IVaultManager) {}

  async execute(args: { vaultId: string; fileId: string }) {
    return this.manager.readMeta(args)
  }
}
