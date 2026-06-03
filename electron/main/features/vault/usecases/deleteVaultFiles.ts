export default class DeleteVaultFiles {
  constructor(private readonly manager: IVaultManager) {}

  async execute(args: { vaultId: string; fileIds: string[] }) {
    return this.manager.deleteFiles(args)
  }
}
