export default class CreateVault {
  constructor(private readonly manager: IVaultManager) {}

  async execute(args: CreateVaultArgs) {
    return this.manager.createVault(args)
  }
}
