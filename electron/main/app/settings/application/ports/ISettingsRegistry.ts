import { RuntimeSchema, Schema, SettingsInterface } from './ISettingsBuilder'

export interface ISettingsRegistry {
  register(namespace: string, provider: SettingsInterface): void

  get(
    namespace: string,
    key: keyof RuntimeSchema,
  ): RuntimeSchema[keyof RuntimeSchema]

  set(
    namespace: string,
    key: keyof RuntimeSchema,
    value: RuntimeSchema[keyof RuntimeSchema],
  ): void

  getSecret(namespace: string, key: string): string

  getSchema(namespace: string): Schema

  flushAll(): Promise<void>
}
