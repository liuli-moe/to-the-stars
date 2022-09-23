<script lang="ts" setup>
import { nextTick, onMounted, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Mark from 'mark.js'
import { wait } from '@liuli-util/async'

const route = useRoute()
const router = useRouter()

const routePath = ref('')
onMounted(() => {
  router.afterEach((to) => {
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
    // await wait(100)
    const q = `[data-s="${route.query.searchId}"]`
    const el = document.querySelector(q) as HTMLElement
    console.log('q', q, el)
    if (!el) {
      return
    }
    el.scrollIntoView({ block: 'center' })
    new Mark(el).mark(query as string)
  })
})
</script>

<template></template>

<style scoped></style>
