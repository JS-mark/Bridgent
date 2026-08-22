<script setup lang="ts">
import { useData } from 'vitepress'
import { computed } from 'vue'
import { en, zh } from '../home-copy'
import { useReveal } from '../reveal'

const { lang } = useData()
const copy = computed(() => lang.value.startsWith('zh') ? zh.sources : en.sources)
const root = useReveal()
</script>

<template>
  <section ref="root" class="sources">
    <div class="sources-container">
      <p class="kicker rv">
        {{ copy.kicker }}
      </p>
      <h2 class="title rv">
        {{ copy.title }}
      </h2>
      <p class="sub rv" style="--rv-delay: 80ms">
        {{ copy.sub }}
      </p>

      <div class="sources-grid">
        <article
          v-for="(item, i) in copy.items"
          :key="item.name"
          class="source-card rv"
          :style="{ '--rv-delay': `${(i % 3) * 90 + 100}ms` }"
        >
          <header class="source-head">
            <span class="source-badge">{{ item.badge }}</span>
            <span class="source-status" :class="`tone-${item.tone}`">{{ item.status }}</span>
          </header>
          <h3 class="source-name">
            {{ item.name }}
          </h3>
          <div class="source-rows">
            <div class="source-row">
              <span class="source-key">{{ copy.youHave }}</span>
              <span class="source-val">{{ item.have }}</span>
            </div>
            <div class="source-arrow" aria-hidden="true">
              ↓
            </div>
            <div class="source-row source-row-strong">
              <span class="source-key">{{ copy.youGet }}</span>
              <span class="source-val">{{ item.get }}</span>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.sources {
  padding: 100px 24px;
}

.sources-container {
  max-width: 1152px;
  margin: 0 auto;
}

.sources-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin-top: 56px;
}

.source-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 13px;
  padding: 22px;
  background: var(--vp-c-bg);
  transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
}

.source-card:hover {
  transform: translateY(-4px);
  border-color: color-mix(in srgb, var(--vp-c-brand-1), transparent 55%);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.08);
}

.dark .source-card:hover {
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.4);
}

.source-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.source-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 32px;
  padding: 0 8px;
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--vp-c-brand-1), transparent 60%);
  background: color-mix(in srgb, var(--vp-c-brand-1), transparent 92%);
  color: var(--vp-c-brand-1);
  font-family: var(--vp-font-family-mono, ui-monospace, monospace);
  font-size: 12.5px;
  font-weight: 700;
}

.source-status {
  font-family: var(--vp-font-family-mono, ui-monospace, monospace);
  font-size: 11px;
  letter-spacing: 0.06em;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid;
}

.tone-ship {
  color: #2b9c4b;
  border-color: rgba(43, 198, 72, 0.4);
  background: rgba(43, 198, 72, 0.09);
}

.tone-new {
  color: #1e8fd6;
  border-color: rgba(32, 168, 247, 0.45);
  background: rgba(32, 168, 247, 0.09);
}

.tone-plan {
  color: var(--vp-c-text-3);
  border-color: var(--vp-c-divider);
  background: transparent;
}

.dark .tone-ship {
  color: #65d943;
}

.dark .tone-new {
  color: #53c8ff;
}

.source-name {
  margin: 16px 0 14px;
  font-size: 19px;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.source-rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.source-row {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--vp-c-default-soft);
}

.source-row-strong {
  border: 1px dashed color-mix(in srgb, var(--vp-c-brand-1), transparent 55%);
  background: color-mix(in srgb, var(--vp-c-brand-1), transparent 95%);
}

.source-key {
  font-family: var(--vp-font-family-mono, ui-monospace, monospace);
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
}

.source-val {
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--vp-c-text-2);
}

.source-row-strong .source-val {
  color: var(--vp-c-text-1);
  font-weight: 550;
}

.source-arrow {
  align-self: center;
  color: var(--vp-c-brand-1);
  font-size: 15px;
  line-height: 1;
  animation: source-dip 2.4s ease-in-out infinite;
}

@keyframes source-dip {
  0%, 100% { transform: translateY(-1px); opacity: 0.65; }
  50% { transform: translateY(3px); opacity: 1; }
}

@media (max-width: 960px) {
  .sources-grid {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 961px) and (max-width: 1200px) {
  .sources-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
