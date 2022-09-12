import { defineClientConfig } from '@vuepress/client'
import { ClientGiscus } from './Giscus'

export default defineClientConfig({
  rootComponents: [ClientGiscus],
})
