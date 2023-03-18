import { Feed, Item } from 'feed'
import FastGlob from 'fast-glob'
import path from 'path'
import { parse } from 'node-html-parser'
import { readFile, writeFile } from 'fs/promises'

// const posts: Item[] = []

// posts.forEach((post) => {
//   feed.addItem({
//     title: post.title,
//     id: post.link,
//     link: post.link,
//     description: post.description,
//     content: post.content,
//     author: [
//       {
//         name: 'Jane Doe',
//         email: 'janedoe@example.com',
//         link: 'https://example.com/janedoe',
//       },
//       {
//         name: 'Joe Smith',
//         email: 'joesmith@example.com',
//         link: 'https://example.com/joesmith',
//       },
//     ],
//     contributor: [
//       {
//         name: 'Shawn Kemp',
//         email: 'shawnkemp@example.com',
//         link: 'https://example.com/shawnkemp',
//       },
//       {
//         name: 'Reggie Miller',
//         email: 'reggiemiller@example.com',
//         link: 'https://example.com/reggiemiller',
//       },
//     ],
//     date: post.date,
//     image: post.image,
//   })
// })

// feed.addCategory('Technologie')

// feed.addContributor({
//   name: 'Johan Cruyff',
//   email: 'johancruyff@example.com',
//   link: 'https://example.com/johancruyff',
// })

function parseFile(file: string): Omit<Item, 'link' | 'date'> {
  const html = parse(file)
  console.log(html.querySelector('title').textContent)
  const content = html.querySelector('.markdown')
  content.removeChild(content.querySelector('h1'))
  return {
    title: html.querySelector('title').textContent,
    description: html.querySelector('meta[name="description"]').getAttribute('content'),
    content: content.innerHTML,
  }
}

async function main() {
  const distPath = path.resolve(__dirname, '../build')

  const list = await FastGlob('books/**/*.html', {
    cwd: distPath,
  })
  const posts: Item[] = await Promise.all(
    list.map(async (it) => {
      const file = await readFile(path.resolve(distPath, it), 'utf-8')
      const r = parseFile(file)
      return {
        ...r,
        link: `https://tts.liuli.moe/${it}`,
        date: new Date(),
      } as Item
    }),
  )

  const feed = new Feed({
    title: '魔法少女小圆 飞向星空',
    description:
      '在经历了几个世纪的动荡之后，一个乌托邦式的 AI— 人类政府治理着地球，预示着后稀缺社会的来临和太空殖民的新时代。一次意外的接触却让科技更先进的敌对外星种族打破了和平，这迫使魔法少女们走出幕后，拯救人类文明。在这一切之中，志筑良子，一个普通的女孩，仰望着星空，好奇着她在宇宙中的归所。',
    id: 'https://tts.liuli.moe/',
    link: 'https://tts.liuli.moe/',
    language: 'zh-CN', // optional, used only in RSS 2.0, possible values: http://www.w3.org/TR/REC-html40/struct/dirlang.html#langcodes
    image: 'https://tts.liuli.moe/cover.png',
    favicon: 'https://tts.liuli.moe/logo.png',
    copyright: 'Copyright © 2023 rxliuli, Inc. Built with feed.',
    feedLinks: {
      json: 'https://tts.liuli.moe/json',
      atom: 'https://tts.liuli.moe/atom',
    },
    author: {
      name: 'rxliuli',
      email: 'rxliuli@gmail.com',
      link: 'https://blog.rxliuli.com/',
    },
  })

  posts.forEach((it) => {
    feed.addItem(it)
  })

  await writeFile(path.resolve(distPath, 'rss.xml'), feed.rss2())
}

main()
