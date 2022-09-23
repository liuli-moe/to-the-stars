import { pick } from 'lodash-es'
import { Page } from 'vuepress-vite'
import { parse } from 'node-html-parser'

export class NodeTextIndexer {
  private sectionMap: Record<number, Pick<Page, 'path' | 'title'>> = {}
  private contentMap: Record<
    number,
    { id: number; sectionId: number; content: string }
  > = {}
  private i = 0
  add(page: Pick<Page, 'path' | 'title' | 'contentRendered'>) {
    const sectionId = this.i++
    this.sectionMap[sectionId] = pick(page, 'title', 'path')
    const dom = parse(page.contentRendered)
    const tags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'li']
    tags
      .flatMap((t) => dom.getElementsByTagName(t))
      .forEach((item) => {
        const s = item.getAttribute('data-s')
        if (!s || s.length === 0) {
          return
        }
        const id = Number.parseInt(s)
        const content = item.innerText
        this.contentMap[id] = { id, sectionId, content }
      })
  }

  toJson(): {} {
    return {
      contentMap: this.contentMap,
      sectionMap: this.sectionMap,
    }
  }
}
