import {
  ISettingsBuilder,
  Schema,
  SettingsInterface,
} from '@/app/settings/application/ports/ISettingsBuilder'
import { existsSync } from 'fs'
import { readFile } from 'fs/promises'

const settingsSchema = {
  vaults: { default: [] as VaultEntry[] },
} satisfies Schema

export class VaultRegistry implements IVaultRegistry {
  private settings: SettingsInterface<typeof settingsSchema>

  constructor(
    builder: ISettingsBuilder,
    private paths: IVaultPaths,
  ) {
    this.settings = builder.defineSettings(
      'vaults',
      'vaults-settings',
      settingsSchema,
    )
  }

  async init() {
    await this.settings.init()
  }

  getAll(): VaultEntry[] {
    return this.settings.vaults
  }
  get(vaultId: string): VaultEntry {
    const vault = this.settings.vaults.find((v) => v.id === vaultId)
    if (!vault) throw new Error('Vault not found')
    return vault
  }
  has(id: string): boolean {
    return this.settings.vaults.some((v) => v.id === id)
  }
  add(entry: VaultEntry): void {
    this.settings.vaults = [...this.settings.vaults, entry]
  }
  async addExisting(location: string): Promise<void> {
    const { id, name } = (await this.getManifest(location)) ?? {}
    if (this.has(id))
      throw new Error(`Vault "${name}" with id ${id} already exists`)
    this.add({ id, name, location })
  }
  remove(id: string): void {
    this.settings.vaults = this.settings.vaults.filter((v) => v.id !== id)
  }
  update(id: string, patch: Partial<VaultEntry>): void {
    this.settings.vaults = this.settings.vaults.map((vault) =>
      vault.id === id ? { ...vault, ...patch } : vault,
    )
  }

  async getManifest(vaultPath: string): Promise<VaultManifest> {
    const manifestPath = this.paths.manifest(vaultPath)
    if (!existsSync(manifestPath))
      throw new Error(`Manifest not found for vault at ${vaultPath}`)
    return JSON.parse(await readFile(manifestPath, 'utf-8'))
  }

  async vaultExists(vaultId: string): Promise<boolean> {
    const vault = this.settings.vaults.find((v) => v.id === vaultId)
    if (!vault) return false

    if (!existsSync(vault.location)) return false

    const manifestPath = this.paths.manifest(vault.location)
    return existsSync(manifestPath)
  }
}
