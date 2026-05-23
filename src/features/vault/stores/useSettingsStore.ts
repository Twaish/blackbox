import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const VIEW_STYLES = ['grid', 'list'] as const
export type ViewStyle = (typeof VIEW_STYLES)[number]

type SettingsStore = {
  shouldPreview: boolean
  viewStyle: ViewStyle

  setShouldPreview: (enabled: boolean) => void
  toggleShouldPreview: () => void

  setViewStyle: (viewStyle: ViewStyle) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      shouldPreview: false,
      viewStyle: 'grid',

      setShouldPreview: (enabled) => set({ shouldPreview: enabled }),

      toggleShouldPreview: () =>
        set((state) => ({
          shouldPreview: !state.shouldPreview,
        })),

      setViewStyle: (viewStyle) => set({ viewStyle }),
    }),
    {
      name: 'settings',
    },
  ),
)
