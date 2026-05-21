import { createOrpcRouter } from '../../electron/main/helpers/ipc/create-orpc-router'
export * from './streams'

export type Router = ReturnType<typeof createOrpcRouter>
