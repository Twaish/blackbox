import { VaultRegistry } from '../adapters/VaultRegistry'

export default class UnlinkVault {
  constructor(private readonly registry: VaultRegistry) {}

  async execute(vaultId: string) {
    return this.registry.remove(vaultId)
  }
}
