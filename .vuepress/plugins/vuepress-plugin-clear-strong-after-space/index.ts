import MarkdownIt from 'markdown-it'
import Token from 'markdown-it/lib/token'
import { Plugin } from 'vuepress-vite'
import { Hooks } from 'vuepress-vite'
/**
 * 清理粗体之后的空格
 */
function _clearStrongAfterSpace(ends: string[]): MarkdownIt.PluginSimple {
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

export function clearStrongAfterSpace() {
  return {
    name: 'clearStrongAfterSpace',
    extendsMarkdown(md, _app) {
      md.use(_clearStrongAfterSpace(['，', '。', '？', '！']))
    },
  } as Plugin & Hooks
}
