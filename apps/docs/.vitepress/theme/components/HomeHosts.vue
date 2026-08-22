<script setup lang="ts">
import { useData } from 'vitepress'
import { computed } from 'vue'
import { en, zh } from '../home-copy'
import { useReveal } from '../reveal'

const { lang } = useData()
const copy = computed(() => lang.value.startsWith('zh') ? zh.hosts : en.hosts)
const root = useReveal()
const prefixed = (path: string) => lang.value.startsWith('zh') ? `/zh${path}` : path
// Each marquee row loops by translating -50%, so the chips are duplicated.
const doubledChips = computed(() => [...copy.value.chips, ...copy.value.chips])
</script>

<template>
  <section ref="root" class="hosts">
    <div class="hosts-container">
      <p class="kicker rv">
        {{ copy.kicker }}
      </p>
      <h2 class="title rv">
        {{ copy.title }}
      </h2>
      <p class="sub rv" style="--rv-delay: 80ms">
        {{ copy.sub }}
      </p>

      <div class="marquee rv" style="--rv-delay: 140ms">
        <div class="marquee-row">
          <div class="marquee-track">
            <span v-for="(chip, i) in doubledChips" :key="i" class="marquee-chip">
              <span class="marquee-dot" />{{ chip }}
            </span>
          </div>
        </div>
        <div class="marquee-row marquee-row-reverse">
          <div class="marquee-track">
            <span v-for="(chip, i) in doubledChips" :key="i" class="marquee-chip">
              <span class="marquee-dot" />{{ chip }}
            </span>
          </div>
        </div>
      </div>

      <div class="cta rv" style="--rv-delay: 200ms">
        <div class="cta-card">
          <h3 class="cta-title">
            {{ copy.ctaTitle }}
          </h3>
          <p class="cta-sub">
            {{ copy.ctaSub }}
          </p>
          <a class="btn btn-primary" :href="prefixed('/guide/getting-started')">
            {{ copy.ctaButton }}<span class="btn-arrow">→</span>
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hosts {
  padding: 100px 24px 120px;
  overflow: hidden;
}

.hosts-container {
  max-width: 1152px;
  margin: 0 auto;
}

/* ── marquee: two rows drifting in opposite directions ── */
.marquee {
  position: relative;
  margin-top: 52px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
}

.marquee-row {
  display: flex;
  overflow: hidden;
}

.marquee-track {
  display: flex;
  gap: 22px;
  flex-shrink: 0;
  padding-right: 22px;
  animation: marquee-scroll 32s linear infinite;
}

.marquee-row-reverse .marquee-track {
  animation-direction: reverse;
}

.marquee:hover .marquee-track {
  animation-play-state: paused;
}

@keyframes marquee-scroll {
  to { transform: translateX(-50%); }
}

.marquee-chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
  padding: 10px 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-mono, ui-monospace, monospace);
  font-size: 13.5px;
  transition: border-color 0.2s ease, color 0.2s ease;
}

.marquee-chip:hover {
  border-color: color-mix(in srgb, var(--vp-c-brand-1), transparent 45%);
  color: var(--vp-c-brand-1);
}

.marquee-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #2bc648;
  box-shadow: 0 0 8px rgba(43, 198, 72, 0.8);
}

/* ── CTA ──────────────────────────────────────────────── */
.cta {
  margin-top: 64px;
}

.cta-card {
  position: relative;
  text-align: center;
  padding: 64px 28px;
  border-radius: 16px;
  color: #eef6ff;
  background:
    radial-gradient(560px 260px at 50% -40%, rgba(32, 168, 247, 0.22), transparent 70%),
    linear-gradient(180deg, #071527, #050f1e);
  border: 1px solid rgba(64, 129, 183, 0.4);
  overflow: hidden;
}

.cta-card::before,
.cta-card::after {
  content: '';
  position: absolute;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  filter: blur(70px);
  opacity: 0.35;
  animation: cta-orb 9s ease-in-out infinite alternate;
  pointer-events: none;
}

.cta-card::before {
  background: #20a8f7;
  top: -90px;
  left: 6%;
}

.cta-card::after {
  background: #5ee361;
  bottom: -100px;
  right: 6%;
  animation-delay: -4s;
}

@keyframes cta-orb {
  to { transform: translateX(60px) scale(1.15); }
}

.cta-title {
  position: relative;
  margin: 0;
  font-size: clamp(24px, 3.4vw, 34px);
  font-weight: 750;
  letter-spacing: -0.02em;
}

.cta-sub {
  position: relative;
  margin: 14px 0 0;
  color: #93aec7;
  font-family: var(--vp-font-family-mono, ui-monospace, monospace);
  font-size: 13px;
}

.btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 30px;
  padding: 12px 26px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.btn-primary {
  color: #04121f;
  background: linear-gradient(135deg, #35b6ff, #5ee361);
  box-shadow: 0 6px 26px rgba(32, 168, 247, 0.4);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 34px rgba(53, 182, 255, 0.55);
}

.btn-arrow {
  transition: transform 0.18s ease;
}

.btn-primary:hover .btn-arrow {
  transform: translateX(4px);
}
</style>
