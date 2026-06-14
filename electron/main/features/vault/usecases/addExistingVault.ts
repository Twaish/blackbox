import { VaultRegistry } from '../infrastructure/adapters/VaultRegistry'

export default class AddExistingVault {
  constructor(private readonly registry: VaultRegistry) {}

  async execute(vaultPath: string) {
    return this.registry.addExisting(vaultPath)
  }
}
