export type VaultStreamHandle = {
  cancel: () => void
  promise: Promise<void>
}
