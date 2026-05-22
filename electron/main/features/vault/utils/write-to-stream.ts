import { WriteStream } from 'fs'

export function writeToStream(
  stream: WriteStream,
  data: Buffer,
): Promise<void> {
  return new Promise((resolve, reject) => {
    stream.write(data, (err) => (err ? reject(err) : resolve()))
  })
}
