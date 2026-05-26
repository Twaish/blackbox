import { EventEmitter } from 'events'

export interface ITaskService extends EventEmitter {
  getTasks(): Record<string, Task>
  startTask(
    task: { label: string; description: string },
    cleanup?: () => void,
  ): Task
  updateTaskProgress(task: {
    id: string
    progress: number
    description: string
  }): Task
  finishTask(id: string): void
  abortTask(id: string): void
}
