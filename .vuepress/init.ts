import * as path from 'path'
import { readdir, writeJson, mkdirp, copy, remove } from 'fs-extra'
import { AsyncArray } from '@liuli-util/async'

async function main() {
  const src = path.resolve(__dirname, '../books')
  const dist = path.resolve(__dirname, '../dist')
  await remove(dist)
  await mkdirp(dist)
  const names = [
    { from: '第一卷-量子纠缠', to: '01' },
    { from: '第二卷-宇宙膨胀', to: '02' },
    { from: '第三卷-存在悖论', to: '03' },
    { from: '番外', to: '00' },
  ]
  for (const name of names) {
    await copy(path.resolve(src, name.from), path.resolve(dist, name.to))
  }
  const sidebar = await AsyncArray.reduce(
    names,
    async (res, item) => {
      const sections = (await readdir(path.resolve(dist, item.to))).filter(
        (name) => name.endsWith('.md') && name !== 'readme.md',
      )
      res[`/dist/${item.to}/`] = ['readme.md', ...sections].map(
        (section) => `/dist/${item.to}/${section}`,
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
        text: item.from,
        link: `/dist/${item.to}/`,
      })),
      sidebar: sidebar,
    },
    { spaces: 2 },
  )
}

main()
