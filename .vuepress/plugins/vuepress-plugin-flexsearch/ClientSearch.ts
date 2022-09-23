import FlexSearch from 'flexsearch'
import { readJson } from 'fs-extra'
import { cut } from 'jieba-wasm'
import { chain } from 'lodash-es'
import path from 'path'
import type { Page } from 'vuepress-vite'
import index from './index.json'
import meta from './meta.json'

export class ClientSearch {
  readonly index = new FlexSearch.Index()
  constructor(json: [string, string][]) {
    json.forEach(([k, v]) => this.index.import(k, v))
  }

  search(s: string): { i: string; s: string[] }[] {
    return chain(cut(s, true))
      .filter((s) => s.trim().length !== 0)
      .flatMap((s) => (this.index.search(s) as string[]).map((i) => ({ i, s })))
      .groupBy((item) => item.i)
      .map((item) => ({ i: item[0].i, s: item.map((v) => v.s as string) }))
      .sortBy((item) => -item.s.length)
      .slice(0, 20)
      .value()
  }
}

async function main() {
  // const index = await readJson(path.resolve(__dirname, 'index.json'), 'utf-8')
  // const meta = (await readJson(
  //   path.resolve(__dirname, 'meta.json'),
  //   'utf-8',
  // )) as {
  //   sectionMap: Record<number, Pick<Page, 'path' | 'title'>>
  //   pMap: Record<number, { sectionId: number; content: string }>
  // }
  const search = new ClientSearch(index as any)
  const r = search.search('紫色魔法少女')
  // const r = chain(cut('紫色魔法少女', true))
  //   .filter((s) => s.trim().length !== 0)
  //   .flatMap((s) => (search.index.search(s) as string[]).map((i) => ({ i, s })))
  //   .groupBy((item) => item.i)
  //   .map((item) => ({ i: item[0].i, s: item.map((v) => v.s as string) }))
  //   .sortBy((item) => -item.s.length)
  //   .value()
  console.log(r)
  // console.log(r.length)
  // console.log(r[0])
  // console.log((meta as any).pMap[r[0].i])
}

main()
