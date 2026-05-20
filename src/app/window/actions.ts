import { ipc } from '@/core/ipc'

export async function minimizeWindow() {
  await ipc.client.electronWindow.minimize()
}
export async function maximizeWindow() {
  await ipc.client.electronWindow.maximize()
}
export async function closeWindow() {
  await ipc.client.electronWindow.close()
}
export async function readyWindow() {
  await ipc.client.electronWindow.ready()
}
