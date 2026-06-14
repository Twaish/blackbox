import { AsyncIteratorClass, consumeEventIterator } from '@orpc/client'

type EventFactory<T> = () => Promise<AsyncIteratorClass<T>>

export function createEventHandler<T>(
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
