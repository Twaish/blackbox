import { AsyncIteratorClass, consumeEventIterator } from '@orpc/client'

type EventFactory<T = any> = () => Promise<AsyncIteratorClass<T>>

export function createEventHandler<T = any>(
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
