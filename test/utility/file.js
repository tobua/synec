import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

export const readFile = (name, options = {}) => {
    const path = join(process.cwd(), name)

    let content = readFileSync(path, 'utf8')

    if (options.json) {
        content = JSON.parse(content)
    }

    return content
}

export const writeFile = (name, content, options = {}) => {
    const path = join(process.cwd(), name)
    let writeContent = content

    if (options.json) {
        writeContent = JSON.stringify(content, null, 2)
    }

    writeFileSync(path, writeContent)
}
