export type VaultStreamHandle = {
  streamId: string
  cancel: () => void
  promise: Promise<unknown>
}
