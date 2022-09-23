<script setup>
import ParentLayout from '@vuepress/theme-default/layouts/Layout.vue'
import { Giscus } from '../plugins/vuepress-plugin-giscus/client/Giscus'
import SearchBox from '../plugins/vuepress-plugin-text-search/components/SearchBox.vue'
import { ClientOnly } from '@vuepress/client'
</script>

<template>
  <ParentLayout>
    <template #page-bottom>
      <ClientOnly>
        <Giscus />
      </ClientOnly>
    </template>
    <template #navbar-before>
      <ClientOnly>
        <SearchBox />
      </ClientOnly>
    </template>
  </ParentLayout>
</template>
