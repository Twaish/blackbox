type BrowserWindowType = import('electron').BrowserWindow

interface IElectronWindow extends EventEmitterType {
  window: BrowserWindowType
  getBrowserWindow(): BrowserWindowType
  loadUrl(url: string): void
  ready(): void
  showWindow(): void
}
