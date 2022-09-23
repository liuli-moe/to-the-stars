import { defineUserConfig, defaultTheme } from 'vuepress-vite'
import data from './.temp/data.json'
import { googleAnalyticsPlugin } from '@vuepress/plugin-google-analytics'
import { sitemapPlugin } from 'vuepress-plugin-sitemap2'
import { giscusPlugin } from './plugins/vuepress-plugin-giscus'
import { clearStrongAfterSpace } from './plugins/vuepress-plugin-clear-strong-after-space'
import { flexSearch } from './plugins/vuepress-plugin-flexsearch'

export default defineUserConfig({
  // 站点配置
  lang: 'zh-CN',
  title: '魔法少女小圆-飞向星空',
  description:
    '在经历了几个世纪的动荡之后，一个乌托邦式的 AI— 人类政府治理着地球，预示着后稀缺社会的来临和太空殖民的新时代。一次意外的接触却让科技更先进的敌对外星种族打破了和平，这迫使魔法少女们走出幕后，拯救人类文明。在这一切之中，志筑良子，一个普通的女孩，仰望着星空，好奇着她在宇宙中的归所。',
  head: [['link', { rel: 'icon', href: '/logo.png' }]],

  // 主题和它的配置
  theme: defaultTheme({
    ...data,
    repo: 'https://github.com/liuli-moe/to-the-stars',
    docsBranch: 'master',
    editLinkText: '在 GitHub 上编辑此页',
    lastUpdatedText: '上次更新',
    contributorsText: '贡献者',
    logo: '/logo.png',
    logoDark: '/logoDark.png',
  }),
  plugins: [
    googleAnalyticsPlugin({ id: 'G-F20H7RT1RM' }),
    sitemapPlugin({ hostname: 'https://tts.liuli.moe' }),
    clearStrongAfterSpace(),
    giscusPlugin({
      repo: 'liuli-moe/to-the-stars', // required, string, format: user_name/repo_name
      repoId: 'R_kgDOG4H10w', // required, string, generate it on Giscus's website
      category: 'General', // required, string
      categoryId: 'DIC_kwDOG4H1084CQhBn', // required, string, generate it on Giscus's website
      mapping: 'pathname', // optional, string, default="title"
      reactionsEnabled: true, // optional, boolean, default=true
      theme: 'preferred_color_scheme', // optional, string, default="light"
      lang: 'zh-CN', // optional, string, default="auto" (follow the site's language, fell to "en" if your site's language is not supported by Giscus)
      lazyLoad: true,
    }),
    flexSearch(),
  ],
  markdown: {
    breaks: true,
  },
})
