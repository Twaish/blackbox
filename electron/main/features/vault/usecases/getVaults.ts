export default class GetVaults {
  constructor(private readonly registry: IVaultRegistry) {}

  async execute() {
    return this.registry.getAll()
  }
}
