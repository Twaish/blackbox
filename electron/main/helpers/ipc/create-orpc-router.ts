import { Modules } from './types'

import { createWindowRouters } from '../../app/window/ipc'
import { createInstanceRouters } from '../../app/instance/ipc'
import { createSettingsRouters } from '../../app/settings/ipc'
import { createVaultRouters } from '../../features/vault/ipc'
import { createTasksRouters } from '../../app/tasks/ipc'

export function createOrpcRouter(modules: Modules) {
  return {
    electronWindow: createWindowRouters(modules),
    instance: createInstanceRouters(modules),
    settings: createSettingsRouters(modules),
    vaults: createVaultRouters(modules),
    tasks: createTasksRouters(modules),
  }
}
