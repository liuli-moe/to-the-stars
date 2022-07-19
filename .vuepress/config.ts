import { defineUserConfig, Plugin } from 'vuepress-vite'
import MarkdownIt from 'markdown-it'
import Token from 'markdown-it/lib/token'
import { Hooks } from 'vuepress-vite'

const data = require('./.temp/data.json')

/**
 * 清理粗体之后的空格
 */
function clearStrongAfterSpace(ends: string[]): MarkdownIt.PluginSimple {
  return (md) => {
    const renderInline = md.renderer.renderInline.bind(md.renderer)
    md.renderer.renderInline = (tokens, options, env) => {
      const checkTokenIndexs = tokens
        .map((token, i) => {
          return {
            p:
              token.type === 'strong_close' &&
              ends.some((end) => tokens[i - 1].content.endsWith(end)) &&
              i + 1 < tokens.length &&
              tokens[i + 1].type === 'text',
            i: i + 1,
          }
        })
        .filter((item) => item.p)
        .map((item) => item.i)
      const newTokens: Token[] = tokens.map((token, i) => {
        if (!checkTokenIndexs.includes(i)) {
          return token
        }
        return {
          ...token,
          content: token.content.trimStart(),
        } as Token
      })
      return renderInline(newTokens, options, env)
    }
  }
}

export default defineUserConfig({
  // 站点配置
  lang: 'zh-CN',
  title: '魔法少女小圆-飞向星空',
  description:
    '在经历了几个世纪的动荡之后，一个乌托邦式的 AI— 人类政府治理着地球，预示着后稀缺社会的来临和太空殖民的新时代。一次意外的接触却让科技更先进的敌对外星种族打破了和平，这迫使魔法少女们走出幕后，拯救人类文明。在这一切之中，志筑良子，一个普通的女孩，仰望着星空，好奇着她在宇宙中的归所。',

  // 主题和它的配置
  theme: '@vuepress/theme-default',
  themeConfig: {
    ...data,
    repo: 'https://github.com/liuli-moe/to-the-stars',
    docsBranch: 'master',
    editLinkText: '在 GitHub 上编辑此页',
    lastUpdatedText: '上次更新',
    contributorsText: '贡献者',
  },
  plugins: [
    ['@vuepress/plugin-google-analytics', { id: 'G-F20H7RT1RM' }],
    {
      name: 'clearStrongAfterSpace',
      extendsMarkdown(md, _app) {
        md.use(clearStrongAfterSpace(['，', '。', '？', '！']))
      },
    } as Plugin & Hooks,
  ],
  markdown: {
    breaks: true,
  },
})
