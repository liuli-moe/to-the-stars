import { AsyncArray } from '@liuli-util/async'
import { mkdirp, readdir, remove, stat } from 'fs-extra'
import * as path from 'path'
import { execPromise } from './util/execPromise'

/**
 * 生成 pandoc 生成命令
 * @param title
 * @param dir
 * @returns
 */
async function genCmd(title: string, dir: string) {
  const list = (await readdir(dir))
    .sort((a, b) => a.localeCompare(b))
    .filter((name) => name.endsWith('.md') && name !== 'readme.md')
  // console.log('list: ', list)
  return `pandoc -o ../../dist/${title} readme.md ${list.join(' ')}`
}

/**
 * 处理每一卷
 */
async function handleSection(cwd: string) {
  const cmd = await genCmd(path.basename(cwd) + '.epub', cwd)
  await execPromise(cmd, { cwd })
}

async function main() {
  const distPath = path.resolve(__dirname, '../dist')
  await remove(distPath)
  await mkdirp(distPath)
  const booksPath = path.resolve(__dirname, '../books')
  const list = await AsyncArray.filter(
    await readdir(booksPath),
    async (name) => {
      return (await stat(path.resolve(booksPath, name))).isDirectory()
    },
  )
  for (const name of list) {
    await handleSection(path.resolve(booksPath, name))
  }
}

main()
