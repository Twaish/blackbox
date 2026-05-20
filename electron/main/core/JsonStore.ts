import path from 'path'
import fs from 'fs/promises'
import { existsSync, mkdirSync } from 'fs'
import EventEmitter from 'events'

export class JsonStore extends EventEmitter {
  basePath: string
  fullPath: string
  constructor(options: { basePath?: string; root: string }) {
    super()
    this.basePath = options.basePath ?? ''
    this.fullPath = path.join(options.root, this.basePath)
    if (!existsSync(this.fullPath)) {
      mkdirSync(this.fullPath, { recursive: true })
    }
  }

  private getSafePath(filename: string): string {
    const resolvedPath = path.join(this.fullPath, `${filename}.json`)
    const normalizedRelative = path.relative(this.fullPath, resolvedPath)

    if (
      normalizedRelative.startsWith('..') ||
      path.isAbsolute(normalizedRelative)
    ) {
      throw new Error('Invalid filename: Path traversal detected.')
    }
    return resolvedPath
  }

  async get<T>(filename: string): Promise<T | null> {
    try {
      const filePath = this.getSafePath(filename)
      const data = await fs.readFile(filePath, 'utf-8')
      const parsedData = JSON.parse(data) as T
      return parsedData
    } catch {
      return null
    }
  }

  async set(filename: string, value: unknown): Promise<void> {
    const filePath = this.getSafePath(filename)
    const content = JSON.stringify(value)
    await fs.writeFile(filePath, content)
    this.emit('changed', filename, filePath, content)
  }

  async remove(filename: string): Promise<void> {
    const filePath = this.getSafePath(filename)

    if (existsSync(filePath)) {
      await fs.unlink(filePath)
      this.emit('removed', filename, filePath)
    }
  }
}
