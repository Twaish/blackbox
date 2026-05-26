import { v4 as uuidv4 } from 'uuid'
import EventEmitter from 'events'

import { ITaskService } from '../interfaces/ITaskService'

export class TaskService extends EventEmitter implements ITaskService {
  private readonly tasks: Record<string, Task> = {}
  private readonly cleanupHandlers: Map<string, () => void> = new Map()
  getTasks(): Record<string, Task> {
    return this.tasks
  }
  startTask(
    task: { label: string; description: string },
    cleanup?: () => void,
  ): Task {
    if (!task.label) throw new Error(`Task is required to have a label`)

    const { label, description = '' } = task

    const id = uuidv4()

    const newTask: Task = {
      id,
      label,
      description,
      progress: 0,
    }
    this.tasks[id] = newTask
    if (cleanup) this.cleanupHandlers.set(id, cleanup)
    this.emit('taskStarted', newTask)
    return newTask
  }
  updateTaskProgress({
    id,
    description,
    progress,
  }: {
    id: string
    progress: number
    description: string
  }): Task {
    const task = this.tasks[id]
    const updatedTask = {
      ...task,
      description,
      progress,
    }
    this.tasks[id] = updatedTask
    this.emit('taskProgress', updatedTask)
    return updatedTask
  }
  finishTask(id: string) {
    const task = this.tasks[id]
    this.endTask(id)
    this.emit('taskFinished', task)
  }
  abortTask(id: string) {
    const task = this.tasks[id]
    if (!task) return

    this.endTask(id)
    this.emit('taskAborted', task)
  }
  private endTask(id: string) {
    delete this.tasks[id]
    const cleanupHandler = this.cleanupHandlers.get(id)
    cleanupHandler?.()
    this.cleanupHandlers.delete(id)
  }
}
