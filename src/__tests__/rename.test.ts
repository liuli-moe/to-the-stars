import { AsyncArray } from '@liuli-util/async'
import { numberToChinese } from 'chinese-numbering'
import { pathExists, readdir, readFile, rename, writeFile } from 'fs-extra'
import path from 'path'
import { findParent } from '../util/findParent'

function calcList(list: string[], first: number): string[] {
  const nameRegexp = /^(\d{3}).*第(.*)章.*.md$/
  return list.map((name) => {
    const r = nameRegexp.exec(name)!
    const num = r[1]
    const cnNum = r[2]
    // console.log(num)
    // console.log(cnNum)
    const n = Number.parseInt(num) + first - 1
    return name
      .replace(num, n.toString().padStart(3, '0'))
      .replace(cnNum, numberToChinese(n))
  })
}

async function renameIndex(dir: string, first: number) {
  const nameRegexp = /^(\d{3}).*第(.*)章.*.md$/
  const list = (await readdir(dir)).filter(
    (name) => nameRegexp.test(name) && !name.startsWith('000'),
  )

  const newList = list.map((name) => {
    const r = nameRegexp.exec(name)!
    const num = r[1]
    const cnNum = r[2]
    // console.log(num)
    // console.log(cnNum)
    const n = Number.parseInt(num) + first - 1
    return name
      .replace(num, n.toString().padStart(3, '0'))
      .replace(cnNum, numberToChinese(n))
  })
  console.log(list)
  console.log(newList)
  await AsyncArray.forEach(list, async (name, i) => {
    await rename(path.resolve(dir, name), path.resolve(dir, newList[i]))
  })
}

it.skip('rename', async () => {
  const rootPath = (await findParent(__dirname, (dir) =>
    pathExists(path.resolve(dir, 'package.json')),
  ))!
  const nameRegexp = /^(\d{3}).*第(.*)章.*.md$/
  const dir = path.resolve(rootPath, 'books/03')
  const list = (await readdir(dir)).filter(
    (name) => nameRegexp.test(name) && !name.startsWith('000'),
  )
  // console.log(list)
  const before = list.filter((name) => Number.parseInt(name.slice(0, 3)) <= 9)
  const newBefore = calcList(before, 34)
  // console.log(newBefore)
  const after = list.filter((name) => Number.parseInt(name.slice(0, 3)) > 9)
  const newAfter = calcList(after, 36)
  console.log(newAfter)

  // await AsyncArray.forEach(before, async (name, i) => {
  //   await rename(path.resolve(dir, name), path.resolve(dir, newBefore[i]))
  // })
  // await AsyncArray.forEach(after, async (name, i) => {
  //   await rename(path.resolve(dir, name), path.resolve(dir, newAfter[i]))
  // })

  // await renameIndex(path.resolve(rootPath, 'books/02'), 18)
  // await renameIndex(path.resolve(rootPath, 'books/03'), 34)
})

async function renameTitle(dir: string) {
  const titleRegexp = /第.*章/
  const list = (await readdir(dir)).filter((name) => titleRegexp.test(name))

  const newTitleList = list.map((name) => {
    const r = titleRegexp.exec(name)!
    const cnNum = r[0]
    return cnNum
  })
  const map = await new AsyncArray(list).map(async (name, i) => {
    const content = await readFile(path.resolve(dir, name), 'utf-8')
    return { before: titleRegexp.exec(content)![0], after: newTitleList[i] }
  })
  console.log(map)
  await AsyncArray.forEach(list, async (name, i) => {
    const filePath = path.resolve(dir, name)
    const content = await readFile(path.resolve(dir, name), 'utf-8')
    const re = map[i]
    await writeFile(filePath, content.replace(re.before, re.after))
  })
}

it('rename title', async () => {
  const rootPath = (await findParent(__dirname, (dir) =>
    pathExists(path.resolve(dir, 'package.json')),
  ))!
  // await renameTitle(path.resolve(rootPath, 'books/02'))
  await renameTitle(path.resolve(rootPath, 'books/03'))
})
