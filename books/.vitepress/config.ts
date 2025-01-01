import { defineConfig } from 'vitepress'
import { generateSidebar } from 'vitepress-sidebar'
import taskLists from '@rxliuli/markdown-it-task-lists'
import { cjk } from 'markdown-it-cjk-space-clean'
import { Sidebar, SidebarItem, SidebarMulti } from 'vitepress-sidebar/types'
import footnote from 'markdown-it-footnote'

function aliasReadmeToIndex(sidebar: Sidebar): Sidebar {
  if (Array.isArray(sidebar)) {
    return sidebar
      .filter((it) => it.link !== '/readme')
      .map((it) => {
        if (!it.items) {
          return it
        }
        const findIndex = it.items?.findIndex((it) => !!it.link!.endsWith('/readme'))
        if (findIndex === -1) {
          return it
        }
        const del = it.items[findIndex]
        return {
          ...it,
          link: del.link?.replace('readme', 'index'),
          items: it.items.filter((it) => it !== del),
        }
      })
  }
  return Object.keys(sidebar).reduce((acc, key) => {
    const it = sidebar[key]
    acc[key] = {
      ...it,
      items: aliasReadmeToIndex(it.items) as SidebarItem[],
    }
    return acc
  }, {} as SidebarMulti)
}

export default defineConfig({
  rewrites: {
    'readme.md': 'index.md',
    ':a/readme.md': ':a/index.md',
    ':a/:b/readme.md': ':a/:b/index.md',
    ':a/:b/:c/readme.md': ':a/:b/:c/index.md',
    ':a/:b/:c/:d/readme.md': ':a/:b/:c/:d/index.md',
    ':a/:b/:c/:d/:e/readme.md': ':a/:b/:c/:d/:e/index.md',
    ':a/:b/:c/:d/:e/:f/readme.md': ':a/:b/:c/:d/:e/:f/index.md',
  },
  themeConfig: {
    sidebar: aliasReadmeToIndex(
      generateSidebar({
        documentRootPath: '/books',
        useTitleFromFileHeading: true,
        useTitleFromFrontmatter: true,
        useFolderTitleFromIndexFile: true,
        useFolderLinkFromIndexFile: true,
      }),
    ),
  },
  markdown: {
    config(md) {
      md.use(taskLists)
        .use(cjk() as any)
        .use(footnote)
    },
    breaks: true,
  },
})
