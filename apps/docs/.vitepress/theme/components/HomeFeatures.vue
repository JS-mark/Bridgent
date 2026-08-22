<script setup lang="ts">
import { useData } from 'vitepress'
import { computed } from 'vue'
import { en, zh } from '../home-copy'
import { icons } from '../icons'
import { useReveal } from '../reveal'

const { lang } = useData()
const copy = computed(() => lang.value.startsWith('zh') ? zh.features : en.features)
const root = useReveal()

// Spotlight hover: the card tracks the cursor with a radial highlight.
function onMove(e: MouseEvent) {
  const el = e.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
  el.style.setProperty('--my', `${e.clientY - rect.top}px`)
}
</script>

<template>
  <section ref="root" class="features">
    <div class="features-container">
      <p class="kicker rv">
        {{ copy.kicker }}
      </p>
      <h2 class="title rv">
        {{ copy.title }}
      </h2>
      <p class="sub rv" style="--rv-delay: 80ms">
        {{ copy.sub }}
      </p>

      <div class="features-grid">
        <article
          v-for="(item, i) in copy.items"
          :key="item.title"
          class="feature-card rv"
          :style="{ '--rv-delay': `${(i % 3) * 90 + 100}ms` }"
          @mousemove="onMove"
        >
          <span class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" v-html="icons[item.icon]" />
          </span>
          <h3 class="feature-title">
            {{ item.title }}
          </h3>
          <p class="feature-text">
            {{ item.text }}
          </p>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.features {
  padding: 100px 24px;
}

.features-container {
  max-width: 1152px;
  margin: 0 auto;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin-top: 56px;
}

.feature-card {
  --mx: 50%;
  --my: 0%;

  position: relative;
  border: 1px solid var(--vp-c-divider);
  border-radius: 13px;
  padding: 26px 24px;
  background: var(--vp-c-bg);
  overflow: hidden;
  transition: transform 0.25s ease, border-color 0.25s ease;
}

.feature-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(320px circle at var(--mx) var(--my), color-mix(in srgb, var(--vp-c-brand-1), transparent 88%), transparent 65%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.feature-card:hover {
  transform: translateY(-4px);
  border-color: color-mix(in srgb, var(--vp-c-brand-1), transparent 55%);
}

.feature-card:hover::before {
  opacity: 1;
}

.feature-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 11px;
  border: 1px solid color-mix(in srgb, var(--vp-c-brand-1), transparent 62%);
  background: color-mix(in srgb, var(--vp-c-brand-1), transparent 92%);
  color: var(--vp-c-brand-1);
}

.feature-icon svg {
  width: 20px;
  height: 20px;
}

.feature-title {
  position: relative;
  margin: 16px 0 8px;
  font-size: 17.5px;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.feature-text {
  position: relative;
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--vp-c-text-2);
}

@media (max-width: 960px) {
  .features-grid {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 961px) and (max-width: 1200px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
