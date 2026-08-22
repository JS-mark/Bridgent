<script setup lang="ts">
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import Home from './components/Home.vue'

const { frontmatter } = useData()
const isHome = () => frontmatter.value.layout === 'home'
</script>

<template>
  <DefaultTheme.Layout>
    <template #home-hero-before>
      <Home v-if="isHome()" />
    </template>
  </DefaultTheme.Layout>
</template>
