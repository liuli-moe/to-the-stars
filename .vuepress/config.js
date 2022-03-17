const data = require('./.temp/data.json')

module.exports = {
  // 站点配置
  lang: 'zh-CN',
  title: '魔法少女小圆-飞向星空',
  description:
    '在经历了几个世纪的动荡之后，一个乌托邦式的 AI— 人类政府治理着地球，预示着后稀缺社会的来临和太空殖民的新时代。一次意外的接触却让科技更先进的敌对外星种族打破了和平，这迫使魔法少女们走出幕后，拯救人类文明。在这一切之中，志筑良子，一个普通的女孩，仰望着星空，好奇着她在宇宙中的归所。',

  // 主题和它的配置
  theme: '@vuepress/theme-default',
  themeConfig: {
    navbar: [
      ...data.navbar,
      {
        text: 'GitHub',
        link: 'https://github.com/liuli-moe/TtS',
      },
    ],
    sidebar: data.sidebar,
  },
  plugins: [['@vuepress/plugin-google-analytics', { id: 'G-F20H7RT1RM' }]],
}
