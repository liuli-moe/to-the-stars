import { mkdirp, readdir, writeFile, writeJson } from 'fs-extra'
import { config, folderApi, joplinApi, noteApi, PageUtil } from 'joplin-api'
import * as path from 'path'
import { AsyncArray } from '@liuli-util/async'

describe('测试从 joplin 生成文件', () => {
  const tempPath = path.resolve(__dirname, '.temp')
  beforeAll(async () => {
    config.token = ''
    config.port = 41184
    await mkdirp(tempPath)
  })
  it.skip('获取目录', async () => {
    writeJson(path.resolve(tempPath, 'data.json'), await folderApi.listAll(), {
      spaces: 2,
    })
  })
  it.skip('导出目录', async () => {
    async function exportFolder(id: string) {
      const folder = await folderApi.get(id)
      const res = await folderApi.notesByFolderId(folder.id, [
        'id',
        'title',
        'body',
      ])
      const output = path.resolve(tempPath, folder.title)
      await mkdirp(output)
      await AsyncArray.forEach(res, async (item) => {
        const outfile = path.resolve(
          output,
          item.title.slice(2).trim().replace(/ /g, '-') + '.md',
        )
        try {
          await writeFile(
            outfile,
            '#' + item.title.slice(5) + '\n\n' + item.body,
          )
        } catch (e) {
          console.error(outfile, e)
        }
      })
    }
    const idList = [
      '09b362a06009481c83328b8845e4a829',
      '65b8007f6fb5432e9bbbaac5194b3ca9',
      '93070dfeb428482fb36adf4b439783d0',
      'd4aebc2e1c6f4758b58baf87edda16fc',
    ]
    for (const id of idList) {
      await exportFolder(id)
    }
  })
  it.skip('生成 pandoc 导出命令', async () => {
    async function genCmd(title: string, dir: string) {
      const list = (await readdir(dir)).filter(
        (name) => name.endsWith('.md') && name !== 'readme.md',
      )
      return `pandoc -o ${title} readme.md ${list.join(' \\\n')}`
    }
    const booksPath = path.resolve(__dirname, '../../../books')
    const list = await readdir(booksPath)
    const cmd = await genCmd(
      '量子纠缠.epub',
      path.resolve(__dirname, '../../../books/第一卷 量子纠缠'),
    )
    await writeFile(path.resolve(tempPath, 'cmd.txt'), cmd)
  })
})
