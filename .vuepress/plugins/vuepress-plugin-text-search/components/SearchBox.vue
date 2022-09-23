<template>
  <div class="search-box">
    <input
      ref="input"
      aria-label="Search"
      :value="query"
      :class="{ focused: focused }"
      :placeholder="placeholder"
      autocomplete="off"
      spellcheck="false"
      @input="onSearch"
      @focus="focused = true"
      @blur="focused = false"
      @keyup.enter="go(contents[focusIndex])"
      @keyup.up="onUp"
      @keyup.down="onDown"
    />
    <IconSearch class="search-icon" @click.native="expandSearchInput" />
    <SearchCommand class="search-command" @onCommand="expandSearchInput" />
    <ul v-if="showSuggestions" class="suggestions" :class="{ 'align-right': alignRight }" @mouseleave="unfocus">
      <li v-for="(section, i) in suggestions" :key="i" class="suggestion">
        <div class="parent-page-title" v-html="section.title" />
        <a
          v-for="s of section.contents"
          :href="s.path + s.slug"
          @click.prevent
          @mousedown="go(s)"
          @mouseenter="focus(s)"
          :class="{ focused: s.id === contents[focusIndex].id }"
          :data-suggestion="s.id"
        >
          <div class="suggestion-row">
            <!-- <div class="page-title">{{ s.title || s.path }}</div> -->
            <div class="suggestion-content">
              <!-- prettier-ignore -->
              <div v-if="s.headingStr" class="header">
                {{ s.headingDisplay.prefix }}<span class="highlight">{{ s.headingDisplay.highlightedContent }}</span>{{ s.headingDisplay.suffix }}
              </div>
              <!-- prettier-ignore -->
              <div v-if="s.contentStr">
                  <span v-for="item of s.content" :key="item.key" :class="{highlight: item.match}">{{ item.text }}</span>
              </div>
            </div>
          </div>
        </a>
      </li>
    </ul>
    <SearchRouteScroll></SearchRouteScroll>
  </div>
</template>

<script lang="ts" setup>
import IconSearch from './IconSearch.vue'
import SearchCommand from './SearchCommand.vue'
import SearchRouteScroll from './SearchRouteScroll.vue'
import highlightWords, { HighlightWords } from 'highlight-words'
import { search } from '../api/SearchApi'
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useSiteData } from '@vuepress/client'
import { useRouter } from 'vue-router'
import * as asyncUtils from '@liuli-util/async'

const { debounce } = asyncUtils

// see https://vuepress.vuejs.org/plugin/option-api.html#clientdynamicmodules
// import hooks from "@dynamic/hooks";

const suggestions = ref<
  {
    title: string
    contents: {
      id: number
      path: string
      title: string
      parentPageTitle: string
      slug: string
      contentStr: string
      content: HighlightWords.Chunk[]
    }[]
  }[]
>([])
const contents = computed(() => suggestions.value.flatMap((item) => item.contents.map((c) => c)))

const query = ref('')
const focused = ref(true)
const focusIndex = ref(0)

onMounted(() => {
  router.afterEach(() => {
    query.value = ''
    suggestions.value = []
    focused.value = false
    focusIndex.value = 0
  })
})

const onSearch = debounce(async (ev: InputEvent) => {
  await getSuggestions((ev.target as HTMLInputElement).value)
}, 500)

const router = useRouter()
const showSuggestions = computed(() => {
  return focused.value && suggestions.value && suggestions.value.length
})
const siteData = useSiteData()
const alignRight = computed(() => true)
const placeholder = computed(() => siteData.value.locales?.searchPlaceholder || 'Search')

onMounted(async () => {
  await getSuggestions(query.value)
  const params = urlParams()
  if (params) {
    const keyword = params.get('query')
    if (keyword) {
      query.value = decodeURI(keyword)
      focused.value = true
    }
  }
})
async function getSuggestions(keyword: string) {
  query.value = keyword
  if (!query.value) {
    suggestions.value = []
    return
  }
  const list = await search(query.value)
  suggestions.value = list.map((item) => ({
    title: item.title,
    contents: item.contents.map((c) => ({
      id: c.id,
      path: item.path,
      title: item.title,
      parentPageTitle: item.title,
      slug: `?searchId=${c.id}&keyword=${query.value}`,
      contentStr: c.content,
      content: highlightWords({ text: c.content, query: query.value }),
    })),
  }))
  console.log('suggestions', query.value, suggestions.value)
}

const input = ref<HTMLInputElement>()

function onHotkey(event: KeyboardEvent) {
  if (event.target === document.body && event.key === 'k' && event.ctrlKey) {
    input.value!.focus()
    event.preventDefault()
  }
}
function onUp() {
  if (!showSuggestions.value) {
    return
  }
  if (focusIndex.value > 0) {
    focusIndex.value--
  } else {
    focusIndex.value = contents.value.length - 1
  }
  const s = `[data-suggestion="${contents.value[focusIndex.value].id}"]`
  const el = document.querySelector(s)
  console.log('onUp', s, el)
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
function onDown() {
  if (!showSuggestions.value) {
    return
  }
  if (focusIndex.value < contents.value.length - 1) {
    focusIndex.value++
  } else {
    focusIndex.value = 0
  }
  const s = `[data-suggestion="${contents.value[focusIndex.value].id}"]`
  const el = document.querySelector(s)
  console.log('onDown', s, el)
  el?.scrollIntoView({ behavior: 'smooth', block: 'end' })
}
function go(s: { external: boolean; path: string; slug: string }) {
  if (!showSuggestions.value) {
    return
  }
  if (s.external) {
    window.open(s.path + s.slug, '_blank')
  } else {
    router.push(s.path + s.slug)
    query.value = ''
    focusIndex.value = 0
    focused.value = false

    // reset query param
    const params = urlParams()
    if (params) {
      params.delete('query')
      const paramsString = params.toString()
      const newState = window.location.pathname + (paramsString ? `?${paramsString}` : '')
      history.pushState(null, '', newState)
    }
  }
}
function focus(i: number) {
  focusIndex.value = i
}
function unfocus() {
  focusIndex.value = -1
}
function urlParams() {
  if (!window.location.search) {
    return null
  }
  return new URLSearchParams(window.location.search)
}
function expandSearchInput() {
  input.value!.focus()
  focused.value = true
}
onMounted(() => {
  document.addEventListener('keydown', onHotkey)
})
onUnmounted(() => {
  document.removeEventListener('keydown', onHotkey)
})
/* global SEARCH_MAX_SUGGESTIONS, SEARCH_PATHS, SEARCH_HOTKEYS */
</script>

<style lang="stylus">
  :root {
    --vp-c-white: #ffffff;
    --vp-c-white-soft: #f9f9f9;
    --vp-c-white-mute: #f1f1f1;
    --vp-c-black: #1a1a1a;
    --vp-c-black-pure: #000000;
    --vp-c-black-soft: #242424;
    --vp-c-black-mute: #2f2f2f;
    --vp-c-indigo: #213547;
    --vp-c-indigo-soft: #476582;
    --vp-c-indigo-light: #aac8e4;
    --vp-c-gray: #8e8e8e;
    --vp-c-gray-light-1: #aeaeae;
    --vp-c-gray-light-2: #c7c7c7;
    --vp-c-gray-light-3: #d1d1d1;
    --vp-c-gray-light-4: #e5e5e5;
    --vp-c-gray-light-5: #f2f2f2;
    --vp-c-gray-dark-1: #636363;
    --vp-c-gray-dark-2: #484848;
    --vp-c-gray-dark-3: #3a3a3a;
    --vp-c-gray-dark-4: #282828;
    --vp-c-gray-dark-5: #202020;
    --vp-c-gray-dark-6: #ebebeb;
    --vp-c-gray-dark-7: #000000;
    --vp-c-divider-light-1: rgba(60, 60, 60, 0.29);
    --vp-c-divider-light-2: rgba(60, 60, 60, 0.12);
    --vp-c-divider-dark-1: rgba(84, 84, 84, 0.65);
    --vp-c-divider-dark-2: rgba(84, 84, 84, 0.48);
    --vp-c-text-light-1: var(--vp-c-indigo);
    --vp-c-text-light-2: rgba(60, 60, 60, 0.7);
    --vp-c-text-light-3: rgba(60, 60, 60, 0.33);
    --vp-c-text-light-4: rgba(60, 60, 60, 0.18);
    --vp-c-text-light-code: var(--vp-c-indigo-soft);
    --vp-c-text-dark-1: rgba(255, 255, 255, 0.87);
    --vp-c-text-dark-2: rgba(235, 235, 235, 0.6);
    --vp-c-text-dark-3: rgba(235, 235, 235, 0.38);
    --vp-c-text-dark-4: rgba(235, 235, 235, 0.18);
    --vp-c-text-dark-code: var(--vp-c-indigo-light);
    --vp-c-green: #42b883;
    --vp-c-green-light: #42d392;
    --vp-c-green-lighter: #35eb9a;
    --vp-c-green-dark: #33a06f;
    --vp-c-green-darker: #155f3e;
    --vp-c-blue: #3b8eed;
    --vp-c-blue-light: #549ced;
    --vp-c-blue-lighter: #50a2ff;
    --vp-c-blue-dark: #3468a3;
    --vp-c-blue-darker: #255489;
    --vp-c-yellow: #ffc517;
    --vp-c-yellow-light: #ffe417;
    --vp-c-yellow-lighter: #ffff17;
    --vp-c-yellow-dark: #e0ad15;
    --vp-c-yellow-darker: #bc9112;
    --vp-c-red: #ed3c50;
    --vp-c-red-light: #f43771;
    --vp-c-red-lighter: #fd1d7c;
    --vp-c-red-dark: #cd2d3f;
    --vp-c-red-darker: #ab2131;
    --vp-c-purple: #de41e0;
    --vp-c-purple-light: #e936eb;
    --vp-c-purple-lighter: #f616f8;
    --vp-c-purple-dark: #823c83;
    --vp-c-purple-darker: #602960;
  }

  :root {
    /** --c-brand: #5c6ac4; */
    --c-brand-light: #7c87cf;
    --c-brand-dark: #3d4ba9;
  }

  :root {
    --vp-c-bg: var(--vp-c-white);
    --vp-c-bg-soft: var(--vp-c-white-soft);
    --vp-c-bg-mute: var(--vp-c-white-mute);
    --vp-c-bg-code-highlight: var(--vp-c-gray-dark-6);
    --vp-c-divider: var(--vp-c-divider-light-1);
    --vp-c-divider-light: var(--vp-c-divider-light-2);
    --vp-c-divider-inverse: var(--vp-c-divider-dark-1);
    --vp-c-divider-inverse-light: var(--vp-c-divider-dark-2);
    --vp-c-text-1: var(--vp-c-text-light-1);
    --vp-c-text-2: var(--vp-c-text-light-2);
    --vp-c-text-3: var(--vp-c-text-light-3);
    --vp-c-text-4: var(--vp-c-text-light-4);
    --vp-c-text-code: var(--vp-c-text-light-code);
    --vp-c-text-inverse-1: var(--vp-c-text-dark-1);
    --vp-c-text-inverse-2: var(--vp-c-text-dark-2);
    --vp-c-text-inverse-3: var(--vp-c-text-dark-3);
    --vp-c-text-inverse-4: var(--vp-c-text-dark-4);
    --vp-c-brand: var(--c-brand);
    --vp-c-brand-light: var(--c-brand-light);
    --vp-c-brand-dark: var(--c-brand-dark);
    --vp-c-brand-highlight: var(--c-brand-dark);
    --vp-c-page-edit-text: var(--vp-c-black-pure);
  }

  .dark {
    --vp-c-bg: var(--vp-c-black);
    --vp-c-bg-soft: var(--vp-c-black-soft);
    --vp-c-bg-mute: var(--vp-c-black-mute);
    --vp-c-bg-code-highlight: var(--vp-c-gray-dark-7);
    --vp-c-divider: var(--vp-c-divider-dark-1);
    --vp-c-divider-light: var(--vp-c-divider-dark-2);
    --vp-c-divider-inverse: var(--vp-c-divider-light-1);
    --vp-c-divider-inverse-light: var(--vp-c-divider-light-2);
    --vp-c-text-1: var(--vp-c-text-dark-1);
    --vp-c-text-2: var(--vp-c-text-dark-2);
    --vp-c-text-3: var(--vp-c-text-dark-3);
    --vp-c-text-4: var(--vp-c-text-dark-4);
    --vp-c-text-code: var(--vp-c-text-dark-code);
    --vp-c-text-inverse-1: var(--vp-c-text-light-1);
    --vp-c-text-inverse-2: var(--vp-c-text-light-2);
    --vp-c-text-inverse-3: var(--vp-c-text-light-3);
    --vp-c-text-inverse-4: var(--vp-c-text-light-4);
    --vp-c-brand-highlight: var(--vp-c-brand-light);
    --vp-c-page-edit-text: var(--vp-c-white);
  }

  :root {
    --vp-navbar-height: 5rem;
    --vp-statusbar-height: 2rem;
    --vp-sidebar-width: 15vw;
    --vp-toc-width: 16vw;
    --vp-doc-max-width: 50vw;
    --vp-doc-padding: 7vw;
    --vp-screen-max-width: 78vw;
    --vp-font-family-base: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    --vp-font-family-mono: Menlo, Monaco, Consolas, 'Courier New', monospace;
  }

  @media screen and (max-width: $MQWiderDesktop) {
    :root {
        --vp-screen-max-width: 85vw;
        --vp-doc-max-width: 55vw;
        --vp-toc-width: 15vw;
    }
  }

  @media screen and (max-width: $MQWideDesktop) {
    :root {
        --vp-screen-max-width: 90vw;
        --vp-doc-max-width: 57vw;
        --vp-doc-padding: 6vw;
    }
  }

  @media screen and (max-width: $MQDesktop + 1px) {
    :root {
        --vp-sidebar-width: 17vw;
        --vp-screen-max-width: 92vw;
        --vp-doc-max-width: 72vw;
    }
  }

  @media screen and (max-width: $MQNarrow + 1px) {
    :root {
        --vp-sidebar-width: 20vw;
        --vp-doc-max-width: 100vw;
    }
  }

  @media screen and (max-width: $MQMobile) {
    :root {
        --vp-sidebar-width: 260px;
    }
  }

  :root {
    --vp-shadow-1: 0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06);
    --vp-shadow-2: 0 3px 12px rgba(0, 0, 0, 0.07), 0 1px 4px rgba(0, 0, 0, 0.07);
    --vp-shadow-3: 0 12px 32px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.08);
    --vp-shadow-4: 0 14px 44px rgba(0, 0, 0, 0.12), 0 3px 9px rgba(0, 0, 0, 0.12);
    --vp-shadow-5: 0 18px 56px rgba(0, 0, 0, 0.16), 0 4px 12px rgba(0, 0, 0, 0.16);
  }

  :root {
    --vp-diff-inserted-text: #116329;
    --vp-diff-inserted-bg: #dafbe1;
    --vp-diff-deleted-text: #82071e;
    --vp-diff-deleted-bg: #FFEBE9;
  }

  :root {
    --vp-nav-height: 55px;
  }

  *, :before, :after {
    box-sizing: border-box;
  }

$accentColor = #3eaf7c
$textColor = #2c3e50
$borderColor = #eaecef
$codeBgColor = #282c34
$arrowBgColor = #ccc
$badgeTipColor = #42b983
$badgeWarningColor = darken(#ffe564, 35%)
$badgeErrorColor = #DA5961

// 布局
$navbarHeight = 3.6rem
$sidebarWidth = 20rem
$contentWidth = 740px
$homePageWidth = 960px

// 响应式变化点
$MQNarrow = 959px
$MQMobile = 719px
$MQMobileNarrow = 419px

mark {
  font-weight: 500;
}

.search-box {
  display: inline-block;
  position: relative;
  margin-right: 1rem;

  input {
    background-color: var(--c-bg-navbar);
    transition: background-color 0.5s;
    cursor: text;
    width: 10rem;
    height: 2rem;
    color: lighten($textColor, 25%);
    display: inline-block;
    border: none;
    font-size: 0.9rem;
    line-height: 2rem;
    padding: 0 0.5rem 0 2rem;
    outline: none;
    transition: all 0.2s ease;
    background-size: 1.2rem;

    &::placeholder {
      transition: color 0.2s ease;
    }

    &:focus {
      cursor: auto;
      border-color: var(--c-brand);

      &::placeholder {
        color: var(--c-brand);
      }

      &~ .search-icon {
        color: var(--c-brand);
      }
    }

    &.focused {
      // border-bottom: 1px solid darken(var(--vp-c-divider-light), 10%);
      // border: 1px solid darken(var(--vp-c-divider-light), 10%);
      // border-radius: 1rem;
    }
  }

  .search-icon {
    color: var(--vp-c-text-2);
    transition: color 0.5s;
    fill: currentColor;
    width: 20px;
    height: 20px;
    position: relative;
    position: absolute;
    top: 5px;
    left: 3px;
    margin-right: 10px;
    cursor: pointer;
  }

  .search-command {
    margin-right: 1rem;
  }

  .suggestions {
    background-color: var(--vp-c-bg);
    min-width: 500px;
    max-width: 700px;
    max-height: 600px;
    position: absolute;
    top: 2rem;
    box-shadow: var(--vp-shadow-3);
    border-radius: 6px;
    padding: 0.4rem;
    list-style-type: none;
    overflow-x: hidden;
    overflow-y: auto;

    &.align-right {
      right: 0;
    }
  }

  .suggestion {
    letter-spacing: 0.2px;
    line-height: 1.4;
    // padding 0.4rem 0.6rem
    border-radius: 4px;
    cursor: pointer;
    width: 100%;

    .parent-page-title {
      color: white;
      font-weight: 600;
      background-color: var(--c-brand);
      padding: 5px;
    }

    a {
      display: block;
      white-space: normal;
      color: $textColor;
      width: 100%;

      .suggestion-row {
        border-collapse: collapse;
        width: 100%;
        display: table;

        .page-title {
          font-size: rem;
          width: 35%;
          border: 1px solid $borderColor;
          background: #f5f5f5;
          border-left: none;
          display: table-cell;
          text-align: right;
          padding: 5px;
          font-weight: bolder;
        }

        .suggestion-content {
          .highlight {
            color: #000;
            margin: 0 3px;
            padding: 0 3px;
            border-radius: 3px;
            background: rgba(59, 72, 206, 0.2);
          }

          border: 1px solid $borderColor;
          font-weight: 400;
          border-right: none;
          width: 65%;
          display: table-cell;
          padding: 10px;

          .header {
            font-weight: 600;
          }
        }
      }
    }

    a:hover {
      background-color: #f3f4f5;
    }

    .focused {
      background-color: #f3f4f5;
    }
  }
}

.dark .search-box .suggestions {
  background: #fff;
}

@media (max-width: $MQNarrow) {
  .search-box {
    input {
      cursor: pointer;
      width: 0;
      border-color: transparent;
      position: relative;

      &:focus {
        cursor: text;
        left: 0;
        width: 10rem;
      }
    }

    .suggestions {
      background-color: ar(--vp-c-bg);
      min-width: 100vw;
      max-width: 100vw;
      position: fixed;
    }

    .search-command {
      display: none !important;
    }
  }
}

// Match IE11
@media all and (-ms-high-contrast: none) {
  .search-box input {
    height: 2rem;
  }
}

@media (max-width: $MQNarrow) and (min-width: $MQMobile) {
  .search-box {
    .suggestions {
      left: 0;
    }
  }
}

@media (max-width: $MQMobile) {
  .search-box {
    margin-right: 0;

    input {
      left: 1rem;
    }

    .suggestions {
      right: 0;
    }
  }
}

@media (max-width: $MQMobileNarrow) {
  .search-box {
    .suggestions {
      width: calc(100vw - 4rem);
    }

    input:focus {
      width: 8rem;
    }
  }
}
</style>
