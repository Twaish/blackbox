export type Schema = Record<
  string,
  {
    name?: string
    description?: string
    default?: unknown
    secret?: boolean
    visible?: boolean
  }
>

export type OnDiskValue<T> = 'default' extends keyof T
  ? T['default']
  : T extends { secret: true }
    ? { __encrypted: true; value: string }
    : unknown

export type OnDiskSchema<T extends Schema> = {
  [K in keyof T]: OnDiskValue<T[K]>
}

export type RuntimeValue<T> = 'default' extends keyof T
  ? T['default']
  : T extends { secret: true }
    ? string | undefined
    : unknown

export type RuntimeSchema<T extends Schema = Schema> = {
  [K in keyof T]: RuntimeValue<T[K]>
}

export type SettingsInterface<T extends Schema = Schema> = {
  namespace: string
  schema: Schema
  init(): Promise<SettingsInterface<T>>
  get<K extends keyof T>(key: K): RuntimeSchema<T>[K]
  set<K extends keyof T>(key: K, value: RuntimeSchema<T>[K]): void
  getAll(): RuntimeSchema<T>
  isSecret(key: keyof T): boolean
  flushNow(): Promise<void>
} & {
  [P in keyof T as P]: RuntimeSchema<T>[P]
}

export interface ISettingsBuilder {
  defineSettings<T extends Schema>(
    namespace: string,
    filename: string,
    schema: T,
  ): SettingsInterface<T>
}
