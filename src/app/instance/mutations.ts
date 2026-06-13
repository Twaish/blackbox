import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { checkForUpdates } from './actions'

export const useCheckForUpdates = (options: UseMutationOptions = {}) =>
  useMutation({
    mutationFn: async () => await checkForUpdates(),
    ...options,
  })
