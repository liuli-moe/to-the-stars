import { PluginSimple } from 'markdown-it'
import Token from 'markdown-it/lib/token'

export function customAttr(options: {
  types: string[]
  attr: (token: Token) => { k: string; v: string }
}): PluginSimple {
  return (md) => {
    const old = md.renderer.renderAttrs
    md.renderer.renderAttrs = (token) => {
      if (options.types.includes(token.type)) {
        const s = options.attr(token)
        token.attrSet(s.k, s.v)
      }
      return old(token)
    }
  }
}
