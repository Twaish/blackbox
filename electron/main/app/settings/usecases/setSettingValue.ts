import { ISettingsRegistry } from '../application/ports/ISettingsRegistry'

export default class SetSettingValue {
  constructor(private readonly registry: ISettingsRegistry) {}

  async execute(namespace: string, key: string, value: unknown) {
    this.registry.set(namespace, key, value)
  }
}
