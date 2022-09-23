import { PluginObject } from 'vuepress-vite'
import { NodeSearch } from './NodeSearch'
import { customAttr } from './mdItPlugins/customAttrs'
import fsExtra from 'fs-extra'
import path from 'path'

const { writeJson } = fsExtra

export function flexSearch(): PluginObject {
  const search = new NodeSearch()
  return {
    name: 'flexSearch',
    extendsMarkdown(md) {
      let i = 0
      md.use(
        customAttr({
          types: [
            'heading_open',
            'paragraph_open',
            'bullet_list_open',
            'ordered_list_open',
          ],
          attr: () => ({ k: 'data-s', v: (i++).toString() }),
        }),
      )
    },
    async onInitialized(app) {
      const list = app.pages.filter((item) => item.contentRendered)
      console.log('index start', list.length)
      list.forEach((item) => {
        console.log('index: ', item.title)
        search.add(item)
      })
      console.log('index end', list.length)
      const data = await search.toJson()
      await writeJson(path.resolve(__dirname, 'index.json'), data.index)
      await writeJson(path.resolve(__dirname, 'meta.json'), data.meta)
    },
  }
}
