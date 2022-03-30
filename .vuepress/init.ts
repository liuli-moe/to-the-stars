import * as path from 'path'
import { readdir, writeJson, mkdirp, copy, remove } from 'fs-extra'
import { AsyncArray } from '@liuli-util/async'

async function main() {
  const src = path.resolve(__dirname, '../books')
  const dist = path.resolve(__dirname, '../dist')
  await remove(dist)
  await mkdirp(dist)
  const names = [
    { from: '01', to: '第一卷-量子纠缠' },
    { from: '02', to: '第二卷-宇宙膨胀' },
    { from: '03', to: '第三卷-存在悖论' },
    { from: '99', to: '番外' },
  ]
  // for (const name of names) {
  //   await copy(path.resolve(src, name.from), path.resolve(dist, name.to))
  // }
  const sidebar = await AsyncArray.reduce(
    names,
    async (res, item) => {
      const sections = (await readdir(path.resolve(src, item.from))).filter(
        (name) => name.endsWith('.md') && name !== 'readme.md',
      )
      res[`/books/${item.from}/`] = ['readme.md', ...sections].map(
        (section) => `/books/${item.from}/${section}`,
      )
      return res
    },
    {},
  )

  await mkdirp(path.resolve(__dirname, '.temp/'))
  await writeJson(
    path.resolve(__dirname, '.temp/data.json'),
    {
      navbar: names.map((item) => ({
        text: item.to,
        link: `/books/${item.from}/`,
      })),
      sidebar: sidebar,
    },
    { spaces: 2 },
  )
}

main()
