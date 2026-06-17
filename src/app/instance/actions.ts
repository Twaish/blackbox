import { ipc } from '@/core/ipc'
import { createEventHandler } from '@/utils/orpc'

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

export async function selectFiles(): Promise<string[] | null> {
  return await ipc.client.instance.selectFiles()
}

export async function checkForUpdates(): Promise<UpdateStatus> {
  return (await ipc.client.instance.checkForUpdates()) as UpdateStatus
}

export async function downloadUpdate(): Promise<void> {
  return await ipc.client.instance.downloadUpdate()
}

export async function quitAndInstall(): Promise<void> {
  return await ipc.client.instance.quitAndInstall()
}

export async function getUpdateStatus(): Promise<UpdateStatus> {
  return (await ipc.client.instance.getUpdateStatus()) as UpdateStatus
}

export const onStatus = createEventHandler('onStatus', () =>
  ipc.client.instance.onStatus(),
)
