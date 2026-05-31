export default class ChangePassphrase {
  constructor(private readonly manager: IVaultManager) {}

  async execute(args: {
    vaultId: string
    oldPassphrase: string
    newPassphrase: string
  }) {
    return this.manager.changePassphrase(args)
  }
}
