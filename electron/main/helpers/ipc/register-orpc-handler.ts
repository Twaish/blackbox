import { RPCHandler } from '@orpc/server/message-port'
import { ipcMain } from 'electron'

export function registerOrpcHandler(router: Record<never, never>) {
  const rpcHandler: RPCHandler<Record<never, never>> = new RPCHandler(router)

  ipcMain.on('START_ORPC', (event) => {
    const [serverPort] = event.ports

    serverPort.start()

    rpcHandler.upgrade(serverPort)
  })
}
