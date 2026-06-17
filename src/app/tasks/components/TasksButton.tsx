import { useState, useEffect, ComponentProps } from 'react'
import { ListChecks, X } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/utils/tailwind'
import {
  abortTask,
  onTaskAborted,
  onTaskFinished,
  onTaskProgress,
  onTaskStarted,
} from '../actions'

export function TasksButton(props: ComponentProps<typeof PopoverTrigger>) {
  const [open, setOpen] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    const upsertTasks = (patch: Partial<Task> & { id: string }) => {
      setTasks((prev) => {
        const idx = prev.findIndex((t) => t.id === patch.id)
        if (idx === -1) {
          return [
            ...prev,
            {
              id: patch.id,
              label: patch.label ?? 'Task',
              description: patch.description ?? '',
              progress: patch.progress ?? 0,
            },
          ]
        }

        const next = [...prev]
        next[idx] = {
          ...next[idx],
          ...patch,
        }

        return next
      })
    }

    const removeTask = (task: Task) => {
      setTasks((prev) => prev.filter((t) => t.id !== task.id))
    }

    const cancels = [
      onTaskStarted((e: Task) => {
        upsertTasks(e)
        setOpen(true)
      }),
      onTaskProgress(upsertTasks),
      onTaskFinished(removeTask),
      onTaskAborted(removeTask),
    ]

    return () => {
      cancels.forEach((cancel) => cancel())
    }
  }, [])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger {...props} asChild>
        <button
          title="Tasks"
          className={cn(
            'no-drag hover:bg-secondary/50 h-full px-1',
            open && 'bg-secondary/50',
          )}
        >
          <ListChecks
            className={cn(
              'text-muted-foreground h-3.5 w-3.5',
              open && 'text-secondary-foreground',
            )}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="flex max-h-[50vh] min-w-100 flex-col gap-1 overflow-auto p-2"
      >
        <p className="text-muted-foreground text-xs font-medium">
          Tasks ({tasks.length})
        </p>
        {tasks.length ? (
          <div className="flex flex-col gap-1.5">
            {tasks.map((task) => (
              <ActiveTaskItem key={task.id} task={task} onAbort={abortTask} />
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground flex h-30 w-full items-center justify-center text-xs">
            No active tasks
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

function ActiveTaskItem({
  task,
  onAbort,
}: {
  task: Task
  onAbort?: (taskId: string) => void
}) {
  return (
    <div className="bg-background/50 flex items-center gap-2 text-xs backdrop-blur-md">
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs">{task.label}</div>

        <div className="flex items-center gap-1 overflow-hidden">
          {task.description ? (
            <div className="text-muted-foreground mt-0.5 text-[11px] break-all">
              {task.description}
            </div>
          ) : null}

          <div className="ml-auto flex items-center">
            <div className="flex w-16 gap-px">
              {Array.from({ length: 10 }).map((_, j) => (
                <div
                  key={j}
                  className={`h-2 flex-1 rounded-[1px] ${
                    j < Math.floor(task.progress / 10)
                      ? 'bg-primary'
                      : 'bg-secondary'
                  }`}
                />
              ))}
            </div>

            <span className="w-8 text-right font-mono text-[11px]">
              {task.progress}%
            </span>
          </div>
        </div>
      </div>

      {onAbort ? (
        <button
          onClick={() => onAbort(task.id)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  )
}
