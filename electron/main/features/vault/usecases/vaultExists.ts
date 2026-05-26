import { VaultRegistry } from '../adapters/VaultRegistry'

export default class VaultExists {
  constructor(private readonly registry: VaultRegistry) {}

  async execute(vaultId: string) {
    return this.registry.vaultExists(vaultId)
  }
}
