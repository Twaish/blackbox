import { ISettingsRegistry } from '../application/ports/ISettingsRegistry'

export default class GetSettingsSchema {
  constructor(private readonly registry: ISettingsRegistry) {}

  async execute(namespace: string) {
    return this.registry.getSchema(namespace)
  }
}
