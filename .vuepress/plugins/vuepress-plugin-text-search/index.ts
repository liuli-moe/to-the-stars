import { PluginObject } from 'vuepress-vite'
import fsExtra from 'fs-extra'
import path from 'path'
import { NodeTextIndexer } from './NodeTextIndexer'
import { customAttr } from './utils/customAttrs'

const { writeJson, mkdirp } = fsExtra

export function textSearch(options: {}): PluginObject {
  const indexer = new NodeTextIndexer()
  let i = 0
  return {
    name: 'flexSearch',
    onWatched() {
      i = 0
    },
    extendsMarkdown(md) {
      md.use(
        customAttr({
          types: ['heading_open', 'paragraph_open', 'bullet_list_open', 'ordered_list_open'],
          attr: () => ({ k: 'data-s', v: (i++).toString() }),
        }),
      )
    },
    async onInitialized(app) {
      const list = app.pages.filter((item) => item.contentRendered && item.path.startsWith('/books'))
      console.log('index start', list.length)
      list.forEach((item) => {
        console.debug('index: ', item.title)
        indexer.add(item)
      })
      console.log('index end', list.length)
      const publicDir = app.dir.public()
      const data = indexer.toJson()
      await writeJson(path.resolve(publicDir, 'local-search.json'), data)
      console.log('index write')
    },
  }
}
