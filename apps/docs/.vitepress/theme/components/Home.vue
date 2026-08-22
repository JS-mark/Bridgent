<script setup lang="ts">
import AmbientField from './AmbientField.vue'
import HomeCode from './HomeCode.vue'
import HomeFeatures from './HomeFeatures.vue'
import HomeHero from './HomeHero.vue'
import HomeHosts from './HomeHosts.vue'
import HomePipeline from './HomePipeline.vue'
import HomeSources from './HomeSources.vue'
</script>

<template>
  <div class="bgc-home">
    <div class="home-bg" aria-hidden="true">
      <AmbientField />
    </div>
    <HomeHero />
    <HomePipeline />
    <HomeSources />
    <HomeFeatures />
    <HomeCode />
    <HomeHosts />
  </div>
</template>
