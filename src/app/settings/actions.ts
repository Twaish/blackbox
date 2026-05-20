import { ipc } from '@/core/ipc'

export async function getSettingsSchema(namespace: string) {
  try {
    return ipc.client.settings.getSchema(namespace)
  } catch {
    return {}
  }
}

export async function getSettingValue(namespace: string, key: string) {
  const data = await ipc.client.settings.get({ namespace, key })
  if (data == null) return null
  return data
}

export async function setSettingValue(
  namespace: string,
  key: string,
  value: unknown,
) {
  return ipc.client.settings.set({ namespace, key, value })
}
