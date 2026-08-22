<script setup lang="ts">
import { useData } from 'vitepress'
import { computed, ref } from 'vue'
import { en, zh } from '../home-copy'
import { useReveal } from '../reveal'

const { lang } = useData()
const copy = computed(() => lang.value.startsWith('zh') ? zh.code : en.code)
const root = useReveal()

const activeId = ref(copy.value.tabs[0]?.id ?? 'zod')
const activeIndex = computed(() =>
  copy.value.tabs.findIndex(tab => tab.id === activeId.value),
)
const activeTab = computed(() => copy.value.tabs[activeIndex.value] ?? copy.value.tabs[0])
const indicatorStyle = computed(() => ({
  width: `${100 / copy.value.tabs.length}%`,
  transform: `translateX(${activeIndex.value * 100}%)`,
}))

// Tiny TS highlighter: comments first, then strings, then keywords.
function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function highlight(code: string) {
  return code.split('\n').map((line) => {
    const escaped = escapeHtml(line)
    if (line.trimStart().startsWith('//'))
      return `<span class="tk-cmt">${escaped}</span>`
    return escaped
      .replace(/('[^']*')/g, '<span class="tk-str">$1</span>')
      .replace(/\b(import|from|const|await|async|export|new|return)\b/g, '<span class="tk-kw">$1</span>')
  }).join('\n')
}

const highlighted = computed(() => highlight(activeTab.value?.code ?? ''))
</script>

<template>
  <section ref="root" class="code">
    <div class="code-container">
      <p class="kicker rv">
        {{ copy.kicker }}
      </p>
      <h2 class="title rv">
        {{ copy.title }}
      </h2>
      <p class="sub rv" style="--rv-delay: 80ms">
        {{ copy.sub }}
      </p>

      <div class="code-panel rv" style="--rv-delay: 140ms">
        <div class="code-tabs" role="tablist">
          <span class="code-indicator" :style="indicatorStyle" />
          <button
            v-for="tab in copy.tabs"
            :key="tab.id"
            class="code-tab"
            :class="{ active: tab.id === activeId }"
            role="tab"
            :aria-selected="tab.id === activeId"
            @click="activeId = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>
        <Transition name="code-swap" mode="out-in">
          <!-- eslint-disable-next-line vue/no-v-html -- static repo snippets, escaped before wrapping -->
          <pre :key="activeId" class="code-body"><code v-html="highlighted" /></pre>
        </Transition>
      </div>
    </div>
  </section>
</template>

<style scoped>
.code {
  padding: 100px 24px;
}

.code-container {
  max-width: 880px;
  margin: 0 auto;
}

.code-panel {
  margin-top: 48px;
  border: 1px solid #1d3a5c;
  border-radius: 13px;
  background: #04101f;
  box-shadow: 0 26px 70px rgba(2, 10, 22, 0.35);
  overflow: hidden;
}

.code-tabs {
  position: relative;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  border-bottom: 1px solid rgba(46, 90, 138, 0.4);
  background: rgba(7, 20, 38, 0.85);
}

.code-indicator {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  border-bottom: 2px solid #35b6ff;
  background: rgba(32, 168, 247, 0.08);
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.code-tab {
  position: relative;
  z-index: 1;
  padding: 13px 8px;
  border: none;
  background: transparent;
  color: #7d99b6;
  font-family: var(--vp-font-family-mono, ui-monospace, monospace);
  font-size: 13.5px;
  cursor: pointer;
  transition: color 0.2s ease;
}

.code-tab:hover {
  color: #c9e4f8;
}

.code-tab.active {
  color: #53c8ff;
}

.code-body {
  margin: 0;
  padding: 24px 26px;
  overflow-x: auto;
  font-family: var(--vp-font-family-mono, ui-monospace, monospace);
  font-size: 13.5px;
  line-height: 1.85;
  color: #cfe2f2;
  min-height: 420px;
}

.tk-kw {
  color: #7fc9ff;
}

.tk-str {
  color: #8be38b;
}

.tk-cmt {
  color: #587492;
  font-style: italic;
}

.code-swap-enter-active,
.code-swap-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.code-swap-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.code-swap-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 720px) {
  .code-body {
    font-size: 12px;
    padding: 18px 16px;
    min-height: 460px;
  }
}
</style>
