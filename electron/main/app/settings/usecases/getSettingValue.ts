import { ISettingsRegistry } from '../application/ports/ISettingsRegistry'

export default class GetSettingValue {
  constructor(private readonly registry: ISettingsRegistry) {}

  async execute(namespace: string, key: string) {
    return this.registry.get(namespace, key)
  }
}
