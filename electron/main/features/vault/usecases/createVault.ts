export default class CreateVault {
  constructor(private readonly manager: IVaultManager) {}

  async execute(args: { location: string; name: string; passphrase: string }) {
    return this.manager.createVault(args)
  }
}
