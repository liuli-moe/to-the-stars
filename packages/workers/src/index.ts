/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import _ from 'lodash-es'
import type { Page } from 'vuepress-vite'

export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  tts: KVNamespace
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;
}

type SectionMap = Record<number, Pick<Page, 'path' | 'title'>>
type ContentMap = Record<number, { id: number; sectionId: number; content: string }>

// Reference: https://developers.cloudflare.com/workers/examples/cors-header-proxy
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
  'Access-Control-Max-Age': '86400',
}
function handleOptions(request: Request) {
  // Make sure the necessary headers are present
  // for this to be a valid pre-flight request
  let headers = request.headers
  if (
    headers.get('Origin') !== null &&
    headers.get('Access-Control-Request-Method') !== null &&
    headers.get('Access-Control-Request-Headers') !== null
  ) {
    // Handle CORS pre-flight request.
    // If you want to check or reject the requested method + headers
    // you can do that here.
    const respHeaders = {
      ...corsHeaders,
      // Allow all future content Request headers to go back to browser
      // such as Authorization (Bearer) or X-Client-Name-Version
      'Access-Control-Allow-Headers': request.headers.get('Access-Control-Request-Headers'),
    }
    return new Response(null, {
      headers: respHeaders as any,
    })
  } else {
    // Handle standard OPTIONS request.
    // If you want to allow other HTTP Methods, you can do that here.
    return new Response(null, {
      headers: {
        Allow: 'GET, HEAD, POST, OPTIONS',
      },
    })
  }
}

function filterContent(
  data: {
    contentMap: ContentMap
    sectionMap: SectionMap
  },
  query: string,
): {
  contents: {
    id: number
    sectionId: number
    content: string
  }[]
  path: string
  title: string
}[] {
  return _.chain(data.contentMap)
    .filter((item) => item.content.includes(query))
    .slice(0, 20)
    .groupBy((item) => item.sectionId)
    .map((contents) => ({ ...data.sectionMap[contents[0].sectionId], contents }))
    .value()
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const data = JSON.parse((await env.tts.get('data'))!) as {
      contentMap: ContentMap
      sectionMap: SectionMap
    }
    const s = new URL(request.url).searchParams.get('query') as string
    const r = filterContent(data, s)
    const headers = {
      'Access-Control-Allow-Origin': '*',
      Vary: 'Origin',
    }
    console.log('headers', headers, request.url)
    const resp = new Response(JSON.stringify(r), { headers: headers })
    return resp
  },
}
