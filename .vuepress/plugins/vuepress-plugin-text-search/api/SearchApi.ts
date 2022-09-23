import { chain } from 'lodash-es'
import type { Page } from 'vuepress-vite'

type SectionMap = Record<number, Pick<Page, 'path' | 'title'>>
type ContentMap = Record<number, { id: number; sectionId: number; content: string }>

function filterContent(
  data: {
    contentMap: ContentMap
    sectionMap: SectionMap
  },
  query: string,
): {
  contents: {
    id: number
    sectionId: number
    content: string
  }[]
  path: string
  title: string
}[] {
  return chain(data.contentMap)
    .filter((item) => item.content.includes(query))
    .slice(0, 20)
    .groupBy((item) => item.sectionId)
    .map((contents) => ({ ...data.sectionMap[contents[0].sectionId], contents }))
    .value()
}

export async function search(query: string): Promise<
  {
    contents: {
      id: number
      sectionId: number
      content: string
    }[]
    path: string
    title: string
  }[]
> {
  if (__VUEPRESS_DEV__) {
    const data = await import('../.temp/data.json')
    return filterContent(data as any, query)
  }

  const resp = await fetch(`https://tts-search.liuli.moe/?query=${encodeURIComponent(query)}`)
  const r = await resp.json()
  return r
}
