import {
  RuntimeSchema,
  Schema,
  SettingsInterface,
} from '../../application/ports/ISettingsBuilder'
import { ISettingsRegistry } from '../../application/ports/ISettingsRegistry'

export class SettingsRegistry implements ISettingsRegistry {
  private providers = new Map<string, SettingsInterface>()

  private getProvider(namespace: string): SettingsInterface {
    const provider = this.providers.get(namespace)
    if (!provider) {
      throw new Error(`No provider for namespace ${namespace}`)
    }
    return provider
  }

  register(namespace: string, provider: SettingsInterface): void {
    this.providers.set(namespace, provider)
  }

  getSchema(namespace: string): Schema {
    return this.getProvider(namespace).schema
  }

  get(
    namespace: string,
    key: keyof RuntimeSchema,
  ): RuntimeSchema[keyof RuntimeSchema] {
    return this.getProvider(namespace).get(key)
  }

  set(
    namespace: string,
    key: keyof RuntimeSchema,
    value: RuntimeSchema[keyof RuntimeSchema],
  ): void {
    this.getProvider(namespace).set(key, value)
  }

  getSecret(namespace: string, key: string): string {
    function isString(value: unknown): value is string {
      return typeof value === 'string'
    }

    const value = this.get(namespace, key)

    if (!isString(value)) {
      throw new Error(`Secret value must be a string value`)
    }

    return value
  }

  async flushAll(): Promise<void> {
    await Promise.all(
      this.providers.values().map((provider) => provider.flushNow()),
    )
  }
}
