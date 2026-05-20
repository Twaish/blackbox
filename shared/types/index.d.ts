import { createOrpcRouter } from '../../electron/main/helpers/ipc/create-orpc-router'

export type Router = ReturnType<typeof createOrpcRouter>
