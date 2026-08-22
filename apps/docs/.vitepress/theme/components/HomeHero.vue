<script setup lang="ts">
import { useData } from 'vitepress'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { en, zh } from '../home-copy'
import { icons } from '../icons'
import { useReveal } from '../reveal'

const { lang } = useData()
const copy = computed(() => lang.value.startsWith('zh') ? zh.hero : en.hero)
const prefixed = (path: string) => lang.value.startsWith('zh') ? `/zh${path}` : path

const root = useReveal()

// Typing terminal: commands type char-by-step, outputs flash in, then loop.
const done = ref<{ kind: 'cmd' | 'out', text: string }[]>([])
const active = ref('')
const activeKind = ref<'cmd' | 'out'>('cmd')
let cancelled = false
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

onMounted(async () => {
  const lines = copy.value.terminal
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) {
    done.value = lines.map(line => line.cmd
      ? { kind: 'cmd' as const, text: line.cmd }
      : { kind: 'out' as const, text: line.out ?? '' })
    return
  }
  await sleep(600)
  for (;;) {
    if (cancelled)
      return
    done.value = []
    for (const line of lines) {
      if (cancelled)
        return
      if (line.cmd) {
        activeKind.value = 'cmd'
        for (const char of line.cmd) {
          if (cancelled)
            return
          active.value += char
          await sleep(26)
        }
        await sleep(420)
        done.value = [...done.value, { kind: 'cmd', text: line.cmd }]
        active.value = ''
      }
      else if (line.out) {
        activeKind.value = 'out'
        await sleep(260)
        if (cancelled)
          return
        active.value = line.out
        await sleep(900)
        done.value = [...done.value, { kind: 'out', text: line.out }]
        active.value = ''
      }
    }
    await sleep(3200)
  }
})

onBeforeUnmount(() => {
  cancelled = true
})
</script>

<template>
  <section ref="root" class="hero">
    <div class="hero-glow" />

    <div class="hero-grid">
      <div class="hero-copy">
        <span class="hero-badge rv">
          <span class="badge-dot" />{{ copy.badge }}
        </span>
        <h1 class="hero-title rv" style="--rv-delay: 70ms">
          {{ copy.titleTop }}<br>
          <span class="hero-grad">{{ copy.titleGrad }}</span>
        </h1>
        <p class="hero-sub rv" style="--rv-delay: 140ms">
          {{ copy.sub }}
        </p>
        <div class="hero-actions rv" style="--rv-delay: 210ms">
          <a class="btn btn-primary" :href="prefixed('/guide/getting-started')">
            {{ copy.primary }}<span class="btn-arrow">→</span>
          </a>
          <a class="btn btn-ghost" :href="prefixed('/guide/what-is-bridgent')">{{ copy.secondary }}</a>
          <a class="btn btn-ghost" href="https://github.com/js-mark/bridgent" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </div>

      <div class="hero-terminal rv" style="--rv-delay: 260ms">
        <div class="term-bar">
          <span class="term-dots"><span /><span /><span /></span>
          <span class="term-title">terminal — bridgent</span>
        </div>
        <div class="term-body">
          <div v-for="(line, i) in done" :key="i" class="term-line" :class="`term-${line.kind}`">
            <span v-if="line.kind === 'cmd'" class="term-prompt">$</span>
            <span class="term-text">{{ line.text }}</span>
          </div>
          <div v-if="active" class="term-line" :class="`term-${activeKind}`">
            <span v-if="activeKind === 'cmd'" class="term-prompt">$</span>
            <span class="term-text">{{ active }}<span class="term-caret" /></span>
          </div>
        </div>
      </div>
    </div>

    <div class="hero-features">
      <div
        v-for="(f, i) in copy.features"
        :key="f.title"
        class="hf-card rv"
        :style="{ '--rv-delay': `${300 + i * 90}ms` }"
      >
        <span class="hf-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" v-html="icons[f.icon]" />
        </span>
        <div class="hf-body">
          <h3 class="hf-title">
            {{ f.title }}
          </h3>
          <p class="hf-text">
            {{ f.text }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  padding: 96px 24px 0;
  color: #eaf3ff;
  overflow: hidden;
}

/* ── background ───────────────────────────────────────
   The page-level deep-navy surface + constellation field live on .bgc-home
   (Home.vue) so all sections share one continuous background. The hero only
   adds a faint grid glow at the top. */
.hero-glow {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(120, 170, 220, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(120, 170, 220, 0.035) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: radial-gradient(900px 560px at 50% 32%, #000 20%, transparent 78%);
}

/* ── grid: copy + terminal ──────────────────────────── */
.hero-grid {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(0, 0.92fr);
  gap: 56px;
  align-items: center;
  max-width: 1160px;
  margin: 0 auto;
}

.hero-copy {
  text-align: left;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 14px;
  border: 1px solid rgba(93, 168, 222, 0.26);
  border-radius: 999px;
  background: rgba(8, 20, 38, 0.55);
  color: #8fd0ff;
  font-family: var(--vp-font-family-mono, ui-monospace, monospace);
  font-size: 12px;
  letter-spacing: 0.03em;
  backdrop-filter: blur(8px);
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #5ee361;
  box-shadow: 0 0 8px rgba(94, 227, 97, 0.9);
  animation: badge-pulse 2.4s ease-in-out infinite;
}

@keyframes badge-pulse {
  50% { opacity: 0.4; }
}

.hero-title {
  margin: 24px 0 0;
  font-size: clamp(38px, 4.8vw, 58px);
  font-weight: 800;
  line-height: 1.07;
  letter-spacing: -0.032em;
  color: #f5faff;
}

.hero-grad {
  background: linear-gradient(94deg, #4db8ff 8%, #53e0ff 48%, #6ce97c 92%);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: grad-slide 8s ease-in-out infinite;
}

@keyframes grad-slide {
  0%, 100% { background-position: 0% 0; }
  50% { background-position: 100% 0; }
}

.hero-sub {
  margin: 20px 0 0;
  max-width: 540px;
  font-size: 15.5px;
  line-height: 1.8;
  color: #a7bcd3;
}

/* pill buttons — white primary per reference */
.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 32px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px;
  border-radius: 999px;
  font-size: 14.5px;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.btn-primary {
  color: #04101d;
  background: #f2f7fc;
  box-shadow: 0 8px 26px -8px rgba(210, 235, 255, 0.45);
}

.btn-primary:hover {
  transform: translateY(-1.5px);
  background: #ffffff;
  box-shadow: 0 12px 32px -8px rgba(210, 235, 255, 0.6);
}

.btn-arrow {
  transition: transform 0.18s ease;
}

.btn-primary:hover .btn-arrow {
  transform: translateX(3px);
}

.btn-ghost {
  color: #cfdeee;
  border: 1px solid rgba(148, 184, 214, 0.24);
  background: rgba(10, 24, 44, 0.4);
  backdrop-filter: blur(8px);
}

.btn-ghost:hover {
  transform: translateY(-1.5px);
  border-color: rgba(83, 224, 255, 0.45);
  color: #eaf6ff;
}

/* ── terminal ───────────────────────────────────────── */
.hero-terminal {
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 14px;
  background: rgba(7, 14, 26, 0.82);
  backdrop-filter: blur(14px);
  box-shadow: 0 34px 90px -24px rgba(0, 4, 12, 0.75);
  overflow: hidden;
}

.term-bar {
  display: flex;
  align-items: center;
  padding: 11px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(13, 22, 38, 0.6);
}

.term-dots {
  display: inline-flex;
  gap: 6px;
}

.term-dots span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.term-dots span:nth-child(1) { background: #ff5f57; }
.term-dots span:nth-child(2) { background: #febc2e; }
.term-dots span:nth-child(3) { background: #28c840; }

.term-title {
  margin-left: auto;
  color: #5d7590;
  font-family: var(--vp-font-family-mono, ui-monospace, monospace);
  font-size: 11px;
  letter-spacing: 0.04em;
}

.term-body {
  padding: 18px 20px 20px;
  min-height: 188px;
  font-family: var(--vp-font-family-mono, ui-monospace, monospace);
  font-size: 13px;
  line-height: 2.05;
}

.term-line {
  white-space: pre-wrap;
  word-break: break-all;
}

.term-prompt {
  margin-right: 10px;
  color: #4fd97c;
  font-weight: 700;
  user-select: none;
}

.term-cmd .term-text {
  color: #d9e9f8;
}

.term-out .term-text {
  color: #56cdf5;
}

.term-caret {
  display: inline-block;
  width: 7px;
  height: 14px;
  margin-left: 2px;
  vertical-align: -2px;
  background: #53e0ff;
  animation: caret-blink 0.9s steps(1) infinite;
}

@keyframes caret-blink {
  50% { opacity: 0; }
}

/* ── feature cards row ──────────────────────────────── */
.hero-features {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  max-width: 1160px;
  margin: 72px auto 0;
  padding-bottom: 72px;
}

.hf-card {
  display: flex;
  gap: 16px;
  padding: 22px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  transition: transform 0.25s ease, border-color 0.25s ease, background 0.25s ease;
}

.hf-card:hover {
  transform: translateY(-3px);
  border-color: rgba(83, 224, 255, 0.32);
  background: rgba(255, 255, 255, 0.045);
}

.hf-icon {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid rgba(83, 224, 255, 0.22);
  border-radius: 11px;
  background: rgba(32, 168, 247, 0.09);
  color: #53c8ff;
}

.hf-icon svg {
  width: 20px;
  height: 20px;
}

.hf-title {
  margin: 1px 0 6px;
  font-size: 15.5px;
  font-weight: 650;
  letter-spacing: -0.01em;
  color: #eef5fc;
}

.hf-text {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.65;
  color: #93aec7;
}

/* ── light mode ─────────────────────────────────────────
   The terminal stays dark in both modes (it depicts a screen); everything
   else flips to ink-on-paper. */
:root:not(.dark) .hero {
  color: #33475c;
}

:root:not(.dark) .hero-glow {
  background-image:
    linear-gradient(rgba(70, 110, 160, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(70, 110, 160, 0.06) 1px, transparent 1px);
}

:root:not(.dark) .hero-title {
  color: #0b1b29;
}

:root:not(.dark) .hero-grad {
  background-image: linear-gradient(94deg, #0e96dd 8%, #0891b2 48%, #16a34a 92%);
}

:root:not(.dark) .hero-sub {
  color: #51687e;
}

:root:not(.dark) .hero-badge {
  border-color: rgba(14, 150, 221, 0.32);
  background: rgba(255, 255, 255, 0.6);
  color: #0e96dd;
}

:root:not(.dark) .btn-primary {
  color: #f5faff;
  background: #10233a;
  box-shadow: 0 8px 26px -8px rgba(16, 35, 58, 0.4);
}

:root:not(.dark) .btn-primary:hover {
  background: #16304e;
  box-shadow: 0 12px 32px -8px rgba(16, 35, 58, 0.5);
}

:root:not(.dark) .btn-ghost {
  color: #33505f;
  border-color: rgba(15, 40, 70, 0.16);
  background: rgba(255, 255, 255, 0.55);
}

:root:not(.dark) .btn-ghost:hover {
  border-color: rgba(14, 150, 221, 0.5);
  color: #0b1b29;
}

:root:not(.dark) .hf-card {
  border-color: rgba(15, 40, 70, 0.1);
  background: rgba(255, 255, 255, 0.72);
}

:root:not(.dark) .hf-card:hover {
  border-color: rgba(14, 150, 221, 0.4);
  background: #ffffff;
}

:root:not(.dark) .hf-icon {
  border-color: rgba(14, 150, 221, 0.28);
  background: rgba(32, 168, 247, 0.08);
  color: #0e96dd;
}

:root:not(.dark) .hf-title {
  color: #10233a;
}

:root:not(.dark) .hf-text {
  color: #5a7186;
}

@media (max-width: 960px) {
  .hero {
    padding-top: 64px;
  }

  .hero-grid {
    grid-template-columns: 1fr;
    gap: 40px;
  }

  .hero-features {
    grid-template-columns: 1fr;
    margin-top: 56px;
  }
}
</style>
