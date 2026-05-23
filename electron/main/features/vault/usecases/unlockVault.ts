export default class UnlockVault {
  constructor(private readonly manager: IVaultManager) {}

  async execute(args: { vaultId: string; passphrase: string }) {
    return this.manager.unlockVault(args)
  }
}
