import { Page } from 'vuepress-vite'
import FlexSearch from 'flexsearch'
import jieba from 'nodejieba'
import { parse } from 'node-html-parser'
import { pick } from 'lodash-es'

function exportIndex(flexSearchIndex: FlexSearch.Index) {
  // https://github.com/nextapps-de/flexsearch/issues/299
  // https://github.com/nextapps-de/flexsearch/issues/274
  return new Promise<[string, any][]>((res, rej) => {
    const pkg: [string, any][] = []
    const expected = new Set([
      'reg',
      'reg.cfg',
      'reg.cfg.map',
      'reg.cfg.map.ctx',
    ])
    const received = new Set<string>()

    const setsEq = (a: Set<string>, b: Set<string>) => {
      if (a.size != b.size) {
        return false
      }

      return Array.from(a).every((el) => b.has(el))
    }

    flexSearchIndex.export((key, data) => {
      // https://github.com/nextapps-de/flexsearch/issues/290
      // https://github.com/nextapps-de/flexsearch/issues/273
      pkg.push([key.toString().split('.').pop()!, data])
      received.add(key as string)

      if (setsEq(expected, received)) {
        res(pkg)
      }
    })
  })
}

export class NodeSearch {
  private readonly index = new FlexSearch.Index({
    encode: (s) => jieba.cutAll(s),
  })

  private sectionMap: Record<number, Pick<Page, 'path' | 'title'>> = {}
  private pMap: Record<number, { sectionId: number; content: string }> = {}
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
        this.pMap[id] = { sectionId, content }
        this.index.add(id, content)
      })
  }

  async toJson(): Promise<{
    index: [string, string][]
    meta: any
  }> {
    return {
      index: await exportIndex(this.index),
      meta: {
        pMap: this.pMap,
        sectionMap: this.sectionMap,
      },
    }
  }
}
