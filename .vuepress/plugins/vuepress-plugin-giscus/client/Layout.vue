<script setup>
import ParentLayout from '@vuepress/theme-default/layouts/Layout.vue'
import { Giscus } from './Giscus'
import { ClientOnly } from '@vuepress/client'
</script>

<template>
  <ParentLayout>
    <template #page-bottom>
      <ClientOnly>
        <Giscus />
      </ClientOnly>
    </template>
  </ParentLayout>
</template>
