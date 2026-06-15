interface IUpdateService extends EventEmitterType {
  getStatus(): UpdateStatus
  checkForUpdates(): Promise<void>
  downloadUpdate(): Promise<void>
  quitAndInstall(): void
}
