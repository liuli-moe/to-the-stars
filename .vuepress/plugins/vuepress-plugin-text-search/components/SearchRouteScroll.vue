<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { RouteLocationNormalized, useRoute, useRouter } from 'vue-router'
import Mark from 'mark.js'
import { wait } from '@liuli-util/async'

const route = useRoute()
const router = useRouter()

const routePath = ref('')
async function triggerScroll(to: RouteLocationNormalized) {
  console.log('route', routePath.value, JSON.parse(JSON.stringify(to)))
  if (routePath.value === route.fullPath) {
    return
  }
  routePath.value = route.fullPath
  const sectionId = route.query.searchId
  const query = route.query.keyword
  if (!sectionId || !query) {
    return
  }
  const q = `[data-s="${route.query.searchId}"]`
  let start = Date.now()
  await wait(() => !!document.querySelector(q) || Date.now() - start > 1000)
  const el = document.querySelector(q) as HTMLElement
  console.log('q', q, el)
  if (!el) {
    return
  }
  el.scrollIntoView({ block: 'center' })
  new Mark(el).mark(query as string, {
    
  })
}
onMounted(async () => {
  router.afterEach(triggerScroll)
  await triggerScroll(route)
})
</script>

<template></template>

<style scoped></style>
