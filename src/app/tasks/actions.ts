import { ipc } from '@/core/ipc'
import { createEventHandler } from '@/utils/orpc'

export async function getTasks() {
  return ipc.client.tasks.get()
}

export async function abortTask(id: string) {
  return ipc.client.tasks.abort(id)
}

export const onTaskStarted = createEventHandler('onTaskStarted', () =>
  ipc.client.tasks.onTaskStarted(),
)
export const onTaskProgress = createEventHandler('onTaskProgress', () =>
  ipc.client.tasks.onTaskProgress(),
)
export const onTaskFinished = createEventHandler('onTaskFinished', () =>
  ipc.client.tasks.onTaskFinished(),
)
export const onTaskAborted = createEventHandler('onTaskAborted', () =>
  ipc.client.tasks.onTaskAborted(),
)
