import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/message-port'
import type { RouterClient } from '@orpc/server'
import { Router } from '@shared/types'

class IPCManager {
  readonly client: RouterClient<Router>

  constructor() {
    const { port1: clientPort, port2: serverPort } = new MessageChannel()

    this.client = createORPCClient(new RPCLink({ port: clientPort }))

    clientPort.start()

    window.postMessage('START_ORPC', '*', [serverPort])
  }
}

declare global {
  interface Window {
    ipc: typeof ipc
  }
}

export const ipc = new IPCManager()
window.ipc = ipc
