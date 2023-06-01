import { AsyncArray } from '@liuli-util/async'
import FastGlob from 'fast-glob'
import { mkdirp, readdir, readFile, remove, stat, writeFile } from 'fs-extra'
import * as path from 'path'
import JSZip from 'jszip'
import matter from 'gray-matter'
import { BookConfig, MarkdownBookBuilder } from '@liuli-util/mdbook'
import {
  fromMarkdown,
  toMarkdown,
  getYamlMeta,
  setYamlMeta,
} from '@liuli-util/markdown-util'

async function clean() {
  const distPath = path.resolve(__dirname, '../dist')
  await remove(distPath)
  await mkdirp(distPath)
}

async function bundle() {
  console.log('打包 zip 文件')
  const distPath = path.resolve(__dirname, '../dist')
  const list = await FastGlob('*.epub', { cwd: distPath })
  const zip = new JSZip()
  await AsyncArray.forEach(list, async (name) => {
    zip.file(name, await readFile(path.resolve(distPath, name)))
  })
  await writeFile(
    path.resolve(distPath, 'books.zip'),
    await zip.generateAsync({ type: 'nodebuffer' }),
  )
}

async function build() {
  const booksPath = path.resolve(__dirname, '../books')
  const map: Record<string, string> = {
    '01': '第一卷-量子纠缠',
    '02': '第二卷-宇宙膨胀',
    '03': '第三卷-存在悖论',
    '04': '第四卷-爱因斯坦-罗森桥',
    '99': '番外',
  }
  const list = await AsyncArray.filter(
    await readdir(booksPath),
    async (name) => {
      return (
        !!map[name] && (await stat(path.resolve(booksPath, name))).isDirectory()
      )
    },
  )
  const builder = new MarkdownBookBuilder()
  const distPath = path.resolve(__dirname, '../dist')
  for (const name of list) {
    console.log(`构建 [${map[name]}]`)
    const entryPoint = path.resolve(booksPath, name, 'readme.md')
    const title = (matter(await readFile(entryPoint)).data as BookConfig).title
    await writeFile(
      path.resolve(distPath, title + '.epub'),
      await builder.generate(entryPoint),
    )
  }
}

async function scanByDir(dirPath: string) {
  const sections = await FastGlob('*.md', {
    cwd: dirPath,
    onlyFiles: true,
    deep: 1,
    ignore: ['readme.md'],
  })

  const entry = path.resolve(dirPath, 'readme.md')
  const md = await readFile(entry, 'utf-8')
  const root = fromMarkdown(md)
  const meta = getYamlMeta<BookConfig>(root)
  setYamlMeta(root, {
    ...meta,
    sections,
  })
  await writeFile(entry, toMarkdown(root))
}

async function scan() {
  const booksPath = path.resolve(__dirname, '../books')
  const list = await AsyncArray.filter(
    await readdir(booksPath),
    async (name) => {
      return (await stat(path.resolve(booksPath, name))).isDirectory()
    },
  )

  await AsyncArray.forEach(list, (item) =>
    scanByDir(path.resolve(booksPath, item)),
  )
}

async function main() {
  await clean()
  await scan()
  await build()
  await bundle()
}

main()
