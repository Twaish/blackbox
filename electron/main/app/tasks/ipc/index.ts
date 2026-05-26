import { Modules } from '@/helpers/ipc/types'
import { eventIterator, os } from '@orpc/server'
import { MemoryPublisher } from '@orpc/experimental-publisher/memory'
import { getTasksOutputSchema, taskIdSchema, taskSchema } from './schemas'

export const subscriptionHandler = <T>(
  iteratorFactory: (signal?: AbortSignal) => AsyncIterable<T>,
) =>
  async function* ({ signal }: { signal?: AbortSignal }) {
    for await (const payload of iteratorFactory(signal)) {
      yield payload
    }
  }

export function createTasksRouters({ TaskService }: Modules) {
  const taskEventPublisher = new MemoryPublisher<{
    taskStarted: Task
    taskProgress: Task
    taskFinished: Task
    taskAborted: Task
  }>()
  TaskService.on('taskStarted', (task: Task) =>
    taskEventPublisher.publish('taskStarted', task),
  )
  TaskService.on('taskProgress', (task: Task) =>
    taskEventPublisher.publish('taskProgress', task),
  )
  TaskService.on('taskFinished', (task: Task) =>
    taskEventPublisher.publish('taskFinished', task),
  )
  TaskService.on('taskAborted', (task: Task) =>
    taskEventPublisher.publish('taskAborted', task),
  )

  return {
    get: os.output(getTasksOutputSchema).handler(() => TaskService.getTasks()),
    abort: os
      .input(taskIdSchema)
      .handler(({ input }) => TaskService.abortTask(input)),

    onTaskStarted: os
      .output(eventIterator(taskSchema))
      .handler(
        subscriptionHandler((signal) =>
          taskEventPublisher.subscribe('taskStarted', { signal }),
        ),
      ),
    onTaskProgress: os
      .output(eventIterator(taskSchema))
      .handler(
        subscriptionHandler((signal) =>
          taskEventPublisher.subscribe('taskProgress', { signal }),
        ),
      ),
    onTaskFinished: os
      .output(eventIterator(taskSchema))
      .handler(
        subscriptionHandler((signal) =>
          taskEventPublisher.subscribe('taskFinished', { signal }),
        ),
      ),
    onTaskAborted: os
      .output(eventIterator(taskSchema))
      .handler(
        subscriptionHandler((signal) =>
          taskEventPublisher.subscribe('taskAborted', { signal }),
        ),
      ),
  }
}
