import { AsyncIteratorClass, consumeEventIterator } from '@orpc/client'
import { ipc } from '@/core/ipc'

export async function getTasks() {
  return ipc.client.tasks.get()
}

export async function abortTask(id: string) {
  return ipc.client.tasks.abort(id)
}

type EventFactory<T = any> = () => Promise<AsyncIteratorClass<T>>

function createEventHandler<T = any>(
  name: string,
  eventFactory: EventFactory<T>,
) {
  return (callback: (event: T) => void) => {
    return consumeEventIterator(eventFactory(), {
      onEvent: callback,
      onError: (err) => {
        if (err.name === 'AbortError') return
        console.error(`${name} error`, err)
      },
    })
  }
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
