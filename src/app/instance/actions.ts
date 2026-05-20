import { ipc } from '@/core/ipc'

export function getAppName() {
  return ipc.client.instance.name()
}

export function getAppVersion() {
  return ipc.client.instance.version()
}

export function openFolder(path: string) {
  return ipc.client.instance.openFolder(path)
}

export function openLink(link: string) {
  window.open(link, '_blank')
}

export async function selectFolder(): Promise<string | null> {
  return await ipc.client.instance.selectFolder()
}

export async function saveFile(filename: string): Promise<string | null> {
  return await ipc.client.instance.saveFile(filename)
}

export async function selectFile(): Promise<string | null> {
  return await ipc.client.instance.selectFile()
}
