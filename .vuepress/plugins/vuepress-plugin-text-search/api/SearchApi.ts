import { chain } from 'lodash-es'
import type { Page } from 'vuepress-vite'
import * as asyncUtils from '@liuli-util/async'

const { once } = asyncUtils

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

const getJson = once(async () => await (await fetch('/local-search.json')).json())

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
  const data = await getJson()
  return filterContent(data as any, query)
}
