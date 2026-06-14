import fs from 'fs'
import app from '../package.json'

fs.writeFileSync(
  'dev-app-update.yml',
  `provider: github
owner: ${app.author}
repo: ${app.name}
`,
)
