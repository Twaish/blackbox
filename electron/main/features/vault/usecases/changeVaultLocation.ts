import { existsSync } from 'fs'
import { VaultRegistry } from '../infrastructure/adapters/VaultRegistry'

export default class ChangeVaultLocation {
  constructor(private readonly registry: VaultRegistry) {}

  async execute({ vaultId, location }: { vaultId: string; location: string }) {
    if (!existsSync(location)) throw new Error(`${location} does not exist`)

    const manifest = await this.registry.getManifest(location)
    if (manifest.id !== vaultId)
      throw new Error(`A different vault is registered here`)

    return this.registry.update(vaultId, {
      location,
    })
  }
}
