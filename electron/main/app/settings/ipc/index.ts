import { Modules } from '@/helpers/ipc/types'
import { os } from '@orpc/server'
import { createSettingsUseCases } from '../usecases'
import {
  getInputSchema,
  namespaceSchema,
  setInputSchema,
  settingsSchema,
} from './schemas'

export function createSettingsRouters(modules: Modules) {
  const useCases = createSettingsUseCases(modules)

  return {
    getSchema: os
      .input(namespaceSchema)
      .output(settingsSchema)
      .handler(({ input }) => useCases.getSettingsSchema.execute(input)),
    get: os
      .input(getInputSchema)
      .handler(({ input }) =>
        useCases.getSettingValue.execute(input.namespace, input.key),
      ),
    set: os
      .input(setInputSchema)
      .handler(({ input }) =>
        useCases.setSettingValue.execute(
          input.namespace,
          input.key,
          input.value,
        ),
      ),
  }
}
