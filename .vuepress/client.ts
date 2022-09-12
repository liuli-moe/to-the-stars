import { defineClientConfig } from '@vuepress/client'
import Giscus from './Giscus'

export default defineClientConfig({
  enhance({ app, router, siteData }) {
  },
  setup() {},
  layouts: {},
  rootComponents: [Giscus],
})
