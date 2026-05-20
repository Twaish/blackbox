import {
  ISettingsBuilder,
  OnDiskSchema,
  OnDiskValue,
  RuntimeSchema,
  Schema,
  SettingsInterface,
} from '../../application/ports/ISettingsBuilder'
import { ISettingsRegistry } from '../../application/ports/ISettingsRegistry'
import { JsonStore } from '@/core/JsonStore'

type SettingsBuilderOptions = {
  store: JsonStore
  encrypt: (value: string) => string
  decrypt: (value: string) => string
}

export class SettingsBuilder implements ISettingsBuilder {
  constructor(
    private readonly options: SettingsBuilderOptions,
    private readonly registry: ISettingsRegistry,
  ) {}

  defineSettings<T extends Schema>(
    namespace: string,
    filename: string,
    schema: T,
  ) {
    const { store, encrypt, decrypt } = this.options

    let cache: RuntimeSchema<T> | null = null
    let writeTimer: NodeJS.Timeout | null = null
    let dirty = false
    const DEBOUNCE_MS = 5000

    function schedulePersist() {
      dirty = true

      if (writeTimer) clearTimeout(writeTimer)

      writeTimer = setTimeout(() => {
        flushNow()
      }, DEBOUNCE_MS)
    }

    async function flushNow() {
      if (!cache) return

      if (writeTimer) {
        clearTimeout(writeTimer)
        writeTimer = null
      }

      if (!dirty) return

      dirty = false

      await persist(cache)
    }

    async function load(): Promise<RuntimeSchema<T>> {
      if (cache) return cache

      const stored: Partial<OnDiskSchema<T>> = (await store.get(filename)) ?? {}

      const result = {} as RuntimeSchema<T>

      for (const [key, definition] of Object.entries(schema) as [
        keyof T,
        T[keyof T],
      ][]) {
        const storedOption = stored[key]

        type RuntimeValue = RuntimeSchema<T>[typeof key]

        function isEncryptedValue(
          value: unknown,
        ): value is { __encrypted: true; value: string } {
          return (
            typeof value === 'object' &&
            value !== null &&
            '__encrypted' in value &&
            value.__encrypted === true &&
            'value' in value
          )
        }

        function isSecretDefinition(
          definition: Schema[keyof Schema],
        ): definition is Omit<Schema[keyof Schema], 'secret' | 'default'> & {
          secret: true
          default?: RuntimeValue
        } {
          return (
            typeof definition === 'object' &&
            definition !== null &&
            'secret' in definition &&
            definition.secret === true
          )
        }

        if (isSecretDefinition(definition) && isEncryptedValue(storedOption)) {
          try {
            result[key] = <RuntimeValue>decrypt(storedOption.value)
          } catch {
            if (definition.default != null) {
              result[key] = definition.default
            }
          }
        } else {
          result[key] = <RuntimeValue>(storedOption ?? definition.default)
        }
      }

      cache = result
      return result
    }

    async function persist(data: RuntimeSchema<T>) {
      const output: { [K in keyof T]?: OnDiskValue<T[K]> } = {}

      for (const key of Object.keys(schema) as (keyof T)[]) {
        const definition = schema[key]
        const value = data[key]

        if (definition.secret && value) {
          const encrypted = encrypt(value as string)

          output[key] = {
            __encrypted: true,
            value: encrypted,
          } as OnDiskValue<T[typeof key]>
        } else {
          output[key] = value as OnDiskValue<T[typeof key]>
        }
      }

      await store.set(filename, output)
      cache = data
    }

    const getCache = () => {
      if (!cache)
        throw new Error(`Settings not initialized. Call .init() first`)
      return cache
    }

    const settingsProvider = {
      namespace,
      schema,
      async init() {
        if (!cache) await load()
        return this
      },
      get<K extends keyof T>(key: K): RuntimeSchema<T>[K] {
        return getCache()[key]
      },

      set<K extends keyof T>(key: K, value: RuntimeSchema<T>[K]) {
        const cache = getCache()

        if (cache[key] === value) return

        cache[key] = value

        schedulePersist()
      },

      getAll(): RuntimeSchema<T> {
        return getCache()
      },

      isSecret(key: keyof T) {
        return schema[key]?.secret === true
      },

      async flushNow() {
        await flushNow()
      },
    }
    const proxy = new Proxy(
      settingsProvider as unknown as SettingsInterface<T>,
      {
        get(target, prop, receiver) {
          if (prop in target) {
            return Reflect.get(target, prop, receiver)
          }

          if (typeof prop === 'string' && prop in schema) {
            return target.get(prop as keyof T)
          }

          return undefined
        },

        set(target, prop, value, receiver) {
          if (typeof prop === 'string' && prop in schema) {
            target.set(prop as keyof T, value)
            return true
          }

          return Reflect.set(target, prop, value, receiver)
        },

        has(target, prop) {
          return prop in target || prop in schema
        },

        ownKeys(target) {
          return [...Reflect.ownKeys(target), ...Object.keys(schema)]
        },

        getOwnPropertyDescriptor(target, prop) {
          if (prop in target) {
            return Object.getOwnPropertyDescriptor(target, prop)
          }

          if (typeof prop === 'string' && prop in schema) {
            return {
              configurable: true,
              enumerable: true,
              writable: true,
              value: target.get(prop as keyof T),
            }
          }

          return undefined
        },
      },
    )
    this.registry.register(namespace, proxy)
    return proxy
  }
}
