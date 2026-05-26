import z from 'zod'

export const taskIdSchema = z.string()
export const taskSchema: z.ZodType<Task> = z.object({
  id: taskIdSchema,
  label: z.string(),
  description: z.string(),
  progress: z.number(),
})

export const getTasksOutputSchema = z.record(taskIdSchema, taskSchema)
