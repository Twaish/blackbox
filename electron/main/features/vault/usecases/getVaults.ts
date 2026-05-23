import { VaultRegistry } from '../adapters/VaultRegistry'

export default class GetVaults {
  constructor(private readonly registry: VaultRegistry) {}

  async execute() {
    return this.registry.getAll()
  }
}
