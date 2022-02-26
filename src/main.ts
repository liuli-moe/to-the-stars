import { AsyncArray } from '@liuli-util/async'
import { mkdirp, readdir, remove, stat } from 'fs-extra'
import * as path from 'path'
import { execPromise } from './util/execPromise'

async function clean() {
  const distPath = path.resolve(__dirname, '../dist')
  await remove(distPath)
  await mkdirp(distPath)
}

async function build() {
  const booksPath = path.resolve(__dirname, '../books')
  const list = await AsyncArray.filter(
    await readdir(booksPath),
    async (name) => {
      return (await stat(path.resolve(booksPath, name))).isDirectory()
    },
  )
  for (const name of list) {
    console.log(`构建 [${name}]`)
    await execPromise('npx mdbook build -o ../../dist', {
      cwd: path.resolve(booksPath, name),
    })
  }
}

async function main() {
  await clean()
  await build()
}

main()
