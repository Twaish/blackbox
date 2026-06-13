export const subscriptionHandler = <T>(
  iteratorFactory: (signal?: AbortSignal) => AsyncIterable<T>,
) =>
  async function* ({ signal }: { signal?: AbortSignal }) {
    for await (const payload of iteratorFactory(signal)) {
      yield payload
    }
  }
