import type { PluginObject } from '@vuepress/core'
import { path } from '@vuepress/utils'
import { GiscusOptions } from '../shared'

export function giscusPlugin(options: GiscusOptions): PluginObject {
  return {
    name: 'vuepress-plugin-giscus',
    define() {
      return { __GISCUS_OPTIONS__: options }
    },
    clientConfigFile: path.resolve(__dirname, '../client'),
  }
}
