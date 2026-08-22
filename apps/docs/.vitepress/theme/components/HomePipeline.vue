<script setup lang="ts">
import { useData } from 'vitepress'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { en, zh } from '../home-copy'
import { useReveal } from '../reveal'

const { lang } = useData()
const copy = computed(() => lang.value.startsWith('zh') ? zh.pipeline : en.pipeline)
const root = useReveal()

// ── phase state: auto-advances, clickable indicators ──
const phase = ref(0)
const statsRoot = ref<HTMLElement | null>(null)
const flowSvg = ref<SVGSVGElement | null>(null)
const flowStage = ref<HTMLElement | null>(null)

function selectPhase(p: number) {
  phase.value = p
  restartTimer()
}

let timer: ReturnType<typeof setInterval> | null = null
function restartTimer() {
  if (timer)
    clearInterval(timer)
  timer = setInterval(() => {
    phase.value = (phase.value + 1) % copy.value.phases.length
  }, 5200)
}

onMounted(() => restartTimer())
onBeforeUnmount(() => {
  if (timer)
    clearInterval(timer)
})

// ── 2D data-flow diagram: sources → core → transports → hosts ──
const BLUE = '#20a8f7'
const CYAN = '#53e0ff'
const GREEN = '#5ee361'
const NODE_R = 17
const CORE_R = 30

interface FlowNode {
  id: string
  label: string
  color: string
  x: number
  y: number
  gate: number
  kind: 'source' | 'core' | 'transport' | 'host'
}

const sources: FlowNode[] = [
  { id: 'zod', label: 'Zod', color: BLUE },
  { id: 'openapi', label: 'OpenAPI', color: CYAN },
  { id: 'prisma', label: 'Prisma', color: GREEN },
  { id: 'drizzle', label: 'Drizzle', color: GREEN },
  { id: 'trpc', label: 'tRPC', color: BLUE },
].map((n, i) => ({ ...n, x: 120, y: 52 + i * 74, gate: 0, kind: 'source' as const }))

const core: FlowNode = { id: 'core', label: '@bridgent/core', color: CYAN, x: 540, y: 200, gate: 1, kind: 'core' }

const transports: FlowNode[] = [
  { id: 'stdio', label: 'stdio', color: GREEN },
  { id: 'http', label: 'HTTP', color: CYAN },
  { id: 'web', label: 'Web fetch', color: BLUE },
].map((n, i) => ({ ...n, x: 820, y: 82 + i * 118, gate: 2, kind: 'transport' as const }))

const hosts: FlowNode[] = [
  { id: 'claude', label: 'Claude Code', color: GREEN },
  { id: 'cursor', label: 'Cursor', color: BLUE },
  { id: 'codex', label: 'Codex', color: GREEN },
  { id: 'gemini', label: 'Gemini CLI', color: BLUE },
].map((n, i) => ({ ...n, x: 1030, y: 60 + i * 93, gate: 3, kind: 'host' as const }))

const nodes = [...sources, core, ...transports, ...hosts]

interface FlowEdge {
  id: string
  from: string
  to: string
  color: string
  gate: number
  d: string
}

function curve(x1: number, y1: number, x2: number, y2: number) {
  const dx = Math.max(60, (x2 - x1) * 0.45)
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
}

const edges: FlowEdge[] = [
  ...sources.map(s => ({
    id: `e-${s.id}-core`,
    from: s.id,
    to: 'core',
    color: s.color,
    gate: 1,
    d: curve(s.x + NODE_R, s.y, core.x - CORE_R - 4, core.y),
  })),
  ...transports.map(t => ({
    id: `e-core-${t.id}`,
    from: 'core',
    to: t.id,
    color: t.color,
    gate: 2,
    d: curve(core.x + CORE_R + 4, core.y, t.x - NODE_R, t.y),
  })),
  ...hosts.map((h, i) => {
    const t = transports[i % transports.length]!
    return {
      id: `e-${t.id}-${h.id}`,
      from: t.id,
      to: h.id,
      color: h.color,
      gate: 3,
      d: curve(t.x + NODE_R, t.y, h.x - NODE_R, h.y),
    }
  }),
]

// stagger inside each phase group
const nodeDelay = new Map<string, number>()
;[sources, [core], transports, hosts].forEach((group) => {
  group.forEach((n, i) => nodeDelay.set(n.id, i * 90))
})
const edgeDelay = new Map<string, number>()
;[edges.filter(e => e.gate === 1), edges.filter(e => e.gate === 2), edges.filter(e => e.gate === 3)]
  .forEach((group) => {
    group.forEach((e, i) => edgeDelay.set(e.id, i * 110))
  })

// ── hover spotlight: highlight one node's subgraph, dim the rest ──
const hoverId = ref('')
const hotEdges = computed(() => {
  if (!hoverId.value)
    return new Set<string>()
  return new Set(edges.filter(e => e.from === hoverId.value || e.to === hoverId.value).map(e => e.id))
})
const hotNodes = computed(() => {
  const set = new Set<string>()
  if (hoverId.value) {
    set.add(hoverId.value)
    for (const e of edges) {
      if (e.from === hoverId.value)
        set.add(e.to)
      if (e.to === hoverId.value)
        set.add(e.from)
    }
  }
  return set
})

// ── packets flowing along active edges ──
interface Packet { edgeId: string, color: string, gate: number, speed: number, offset: number, x: number, y: number }
const packets = reactive<Packet[]>(edges.map((e, i) => ({
  edgeId: e.id,
  color: e.color,
  gate: e.gate,
  speed: 0.22 + (i % 4) * 0.045,
  offset: (i * 0.37) % 1,
  x: -20,
  y: -20,
})))

let raf = 0
let flowIo: IntersectionObserver | null = null
let inView = false
let time = 0
let lastTs = 0

onMounted(() => {
  const svg = flowSvg.value
  const stageEl = flowStage.value
  if (!svg || !stageEl)
    return

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const pathEls = edges.map(e => ({
    el: svg.querySelector<SVGPathElement>(`#${CSS.escape(e.id)}`),
    len: 0,
  }))
  for (const p of pathEls)
    p.len = p.el?.getTotalLength() ?? 0

  if (reduced) {
    // static final state: park packets at edge midpoints
    packets.forEach((pkt, i) => {
      const p = pathEls[i]
      if (p?.el && p.len > 0) {
        const pt = p.el.getPointAtLength(p.len * 0.5)
        pkt.x = pt.x
        pkt.y = pt.y
      }
    })
    phase.value = copy.value.phases.length - 1
    return
  }

  flowIo = new IntersectionObserver((entries) => {
    inView = entries[0]?.isIntersecting ?? false
  }, { threshold: 0.15 })
  flowIo.observe(stageEl)

  const loop = (ts: number) => {
    raf = requestAnimationFrame(loop)
    if (!inView || document.hidden) {
      lastTs = ts
      return
    }
    const delta = Math.min((ts - lastTs) / 1000, 0.05)
    lastTs = ts
    time += delta
    packets.forEach((pkt, i) => {
      const p = pathEls[i]
      if (!p?.el || p.len === 0)
        return
      const t = (pkt.offset + time * pkt.speed) % 1
      const pt = p.el.getPointAtLength(t * p.len)
      pkt.x = pt.x
      pkt.y = pt.y
    })
  }
  raf = requestAnimationFrame(loop)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  flowIo?.disconnect()
})

// ── count-up stats, once when scrolled into view ──
let statIo: IntersectionObserver | null = null
onMounted(() => {
  const el = statsRoot.value
  if (!el)
    return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  statIo = new IntersectionObserver((entries) => {
    if (!entries[0]?.isIntersecting)
      return
    statIo?.disconnect()
    el.querySelectorAll<HTMLElement>('[data-count]').forEach((node) => {
      const target = Number(node.dataset.count ?? '0')
      if (reduced) {
        node.textContent = String(target)
        return
      }
      const start = performance.now()
      const tick = (now: number) => {
        const p = Math.min((now - start) / 900, 1)
        const eased = 1 - (1 - p) ** 3
        node.textContent = String(Math.round(target * eased))
        if (p < 1)
          requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
  }, { threshold: 0.4 })
  statIo.observe(el)
})

onBeforeUnmount(() => statIo?.disconnect())
</script>

<template>
  <section ref="root" class="pipeline">
    <div class="pipeline-container">
      <p class="kicker rv">
        {{ copy.kicker }}
      </p>
      <h2 class="title rv">
        {{ copy.title }}
      </h2>
      <p class="sub rv" style="--rv-delay: 80ms">
        {{ copy.sub }}
      </p>

      <div class="pipeline-stage-wrap rv" style="--rv-delay: 140ms">
        <div ref="flowStage" class="flow-stage">
          <svg ref="flowSvg" viewBox="0 0 1160 400" class="flow-svg" role="img" aria-label="Bridgent data flow">
            <defs>
              <radialGradient id="flow-core-grad">
                <stop offset="0%" stop-color="#bff0ff" />
                <stop offset="55%" stop-color="#37b6f7" />
                <stop offset="100%" stop-color="#0e6cad" />
              </radialGradient>
            </defs>

            <!-- edges -->
            <g class="flow-edges">
              <path
                v-for="e in edges"
                :id="e.id"
                :key="e.id"
                class="flow-edge"
                :class="{ on: phase >= e.gate, hot: hotEdges.has(e.id), dim: hoverId && !hotEdges.has(e.id) }"
                :d="e.d"
                :stroke="e.color"
                pathLength="1"
                :style="{ transitionDelay: `${edgeDelay.get(e.id) ?? 0}ms` }"
              />
            </g>

            <!-- packets -->
            <g class="flow-packets">
              <template v-for="p in packets" :key="p.edgeId">
                <circle
                  class="pkt-halo"
                  :class="{ on: phase >= p.gate, dim: hoverId && !hotEdges.has(p.edgeId) }"
                  :cx="p.x"
                  :cy="p.y"
                  r="7"
                  :fill="p.color"
                />
                <circle
                  class="pkt"
                  :class="{ on: phase >= p.gate, dim: hoverId && !hotEdges.has(p.edgeId) }"
                  :cx="p.x"
                  :cy="p.y"
                  r="3"
                  fill="#eaf6ff"
                />
              </template>
            </g>

            <!-- nodes -->
            <g
              v-for="n in nodes"
              :key="n.id"
              class="flow-node"
              :class="[{ on: phase >= n.gate, hot: hotNodes.has(n.id), dim: hoverId && !hotNodes.has(n.id) }, `kind-${n.kind}`]"
              :transform="`translate(${n.x} ${n.y})`"
              @mouseenter="hoverId = n.id"
              @mouseleave="hoverId = ''"
            >
              <circle class="hit" :r="NODE_R + 12" fill="transparent" />
              <template v-if="n.kind === 'core'">
                <circle class="core-halo" :r="48" />
                <circle class="core-orbit" :r="37" />
                <circle class="core-body" :r="26" fill="url(#flow-core-grad)" />
                <text class="flow-label core-label" :y="56">{{ n.label }}</text>
              </template>
              <template v-else>
                <g class="node-inner" :style="{ transitionDelay: `${nodeDelay.get(n.id) ?? 0}ms` }">
                  <circle class="node-ring" :r="NODE_R" :stroke="n.color" />
                  <circle class="node-dot" :r="4.5" :fill="n.color" />
                  <text class="flow-label" :y="NODE_R + 18">{{ n.label }}</text>
                </g>
              </template>
            </g>
          </svg>
        </div>

        <div class="pipeline-bottom">
          <Transition name="phase-swap" mode="out-in">
            <div :key="phase" class="pipeline-phase">
              <h3 class="phase-title">
                <span class="phase-num">{{ copy.phases[phase]?.label }}</span>{{ copy.phases[phase]?.title }}
              </h3>
              <p class="phase-desc">
                {{ copy.phases[phase]?.desc }}
              </p>
              <div class="phase-chips">
                <span v-for="chip in copy.phases[phase]?.chips ?? []" :key="chip">{{ chip }}</span>
              </div>
            </div>
          </Transition>
          <div class="pipeline-dots" role="tablist">
            <button
              v-for="(p, i) in copy.phases"
              :key="p.label"
              class="pipeline-dot"
              :class="{ active: i === phase }"
              :aria-label="p.title"
              @click="selectPhase(i)"
            >
              {{ p.label }}
            </button>
          </div>
        </div>
      </div>

      <div ref="statsRoot" class="pipeline-stats rv" style="--rv-delay: 220ms">
        <div v-for="stat in copy.stats" :key="stat.label" class="stat">
          <span class="stat-value"><span :data-count="stat.value">0</span><span class="stat-suffix">{{ stat.suffix }}</span></span>
          <span class="stat-label">{{ stat.label }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.pipeline {
  position: relative;
  padding: 110px 24px 90px;
  color: #dfeeff;
  overflow: hidden;
}

.pipeline-container {
  position: relative;
  max-width: 1152px;
  margin: 0 auto;
}

.pipeline .kicker {
  color: #53c8ff;
}

.pipeline .title {
  color: #f2f8ff;
}

.pipeline .sub {
  color: #9db4cc;
}

.pipeline-stage-wrap {
  margin-top: 52px;
  border: 1px solid rgba(64, 129, 183, 0.3);
  border-radius: 16px;
  background: #040b14;
  box-shadow: 0 30px 90px -30px rgba(0, 6, 16, 0.8);
  overflow: hidden;
}

/* ── 2D flow stage ────────────────────────────────────── */
.flow-stage {
  padding: 30px 22px 14px;
  background-image: radial-gradient(circle, rgba(83, 224, 255, 0.07) 1px, transparent 1px);
  background-size: 26px 26px;
}

.flow-svg {
  display: block;
  width: 100%;
  height: auto;
}

/* edges: draw in when their phase activates */
.flow-edge {
  fill: none;
  stroke-width: 1.2;
  stroke-linecap: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  opacity: 0;
  transition:
    stroke-dashoffset 0.9s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.45s ease,
    stroke-width 0.25s ease;
}

.flow-edge.on {
  stroke-dashoffset: 0;
  opacity: 0.38;
}

.flow-edge.hot {
  opacity: 0.95;
  stroke-width: 2.2;
}

.flow-edge.dim {
  opacity: 0.06;
}

/* packets */
.pkt,
.pkt-halo {
  opacity: 0;
  transition: opacity 0.5s ease;
  pointer-events: none;
}

.pkt-halo {
  opacity: 0;
}

.pkt-halo.on {
  opacity: 0.3;
}

.pkt.on {
  opacity: 1;
}

.pkt.dim,
.pkt-halo.dim {
  opacity: 0.08;
}

/* nodes */
.flow-node {
  cursor: pointer;
}

.node-inner {
  opacity: 0;
  transform: scale(0.6);
  transform-box: fill-box;
  transform-origin: center;
  transition:
    opacity 0.45s ease,
    transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.flow-node.on .node-inner {
  opacity: 1;
  transform: scale(1);
}

.node-ring {
  fill: rgba(5, 14, 27, 0.85);
  stroke-width: 1.5;
  transition: stroke-width 0.25s ease;
}

.flow-node.hot .node-ring {
  stroke-width: 2.6;
}

.node-dot {
  transition: r 0.25s ease;
}

.flow-node.hot .node-dot {
  r: 6;
}

.flow-label {
  font-family: var(--vp-font-family-mono, ui-monospace, monospace);
  font-size: 11.5px;
  letter-spacing: 0.04em;
  fill: #a8c6e2;
  text-anchor: middle;
  user-select: none;
}

.flow-node.hot .flow-label {
  fill: #eaf6ff;
}

.flow-node.dim .node-inner {
  opacity: 0.18;
}

/* core node */
.kind-core {
  opacity: 0;
  transition: opacity 0.6s ease;
}

.kind-core.on {
  opacity: 1;
}

.kind-core.dim {
  opacity: 0.18;
}

.core-halo {
  fill: none;
  stroke: rgba(83, 224, 255, 0.14);
  stroke-width: 1;
}

.core-orbit {
  fill: none;
  stroke: rgba(83, 224, 255, 0.55);
  stroke-width: 1.2;
  stroke-dasharray: 3 7;
  stroke-linecap: round;
  transform-box: fill-box;
  transform-origin: center;
  animation: core-spin 14s linear infinite;
}

.core-body {
  transform-box: fill-box;
  transform-origin: center;
  animation: core-pulse 2.8s ease-in-out infinite;
}

.core-label {
  fill: #d7ecff;
  font-size: 12px;
}

@keyframes core-spin {
  to { transform: rotate(360deg); }
}

@keyframes core-pulse {
  50% { transform: scale(1.07); }
}

/* bottom phase panel */
.pipeline-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 20px 24px;
  border-top: 1px solid rgba(64, 129, 183, 0.22);
  background: rgba(6, 16, 31, 0.7);
  min-height: 118px;
}

.pipeline-phase {
  flex: 1;
  min-width: 0;
}

.phase-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #edf5fd;
}

.phase-num {
  font-family: var(--vp-font-family-mono, ui-monospace, monospace);
  font-size: 11.5px;
  color: #53c8ff;
  border: 1px solid rgba(83, 224, 255, 0.35);
  border-radius: 6px;
  padding: 2px 7px;
}

.phase-desc {
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 1.65;
  color: #93aec7;
  max-width: 620px;
}

.phase-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 10px;
}

.phase-chips span {
  font-family: var(--vp-font-family-mono, ui-monospace, monospace);
  font-size: 11.5px;
  color: #bcd8ec;
  padding: 3px 10px;
  border: 1px solid rgba(64, 120, 168, 0.35);
  border-radius: 999px;
  background: rgba(13, 30, 52, 0.55);
}

.pipeline-dots {
  display: flex;
  flex-direction: column;
  gap: 7px;
  flex-shrink: 0;
}

.pipeline-dot {
  width: 40px;
  padding: 5px 0;
  font-family: var(--vp-font-family-mono, ui-monospace, monospace);
  font-size: 11.5px;
  color: #5d7a94;
  background: transparent;
  border: 1px solid rgba(64, 120, 168, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.pipeline-dot:hover {
  color: #c9e4f8;
  border-color: rgba(83, 224, 255, 0.4);
}

.pipeline-dot.active {
  color: #041019;
  background: linear-gradient(135deg, #45baff, #67e87a);
  border-color: transparent;
  font-weight: 700;
}

.phase-swap-enter-active,
.phase-swap-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.phase-swap-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.phase-swap-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.pipeline-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin-top: 44px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 18px 12px;
  border: 1px solid rgba(58, 116, 165, 0.28);
  border-radius: 13px;
  background: rgba(8, 20, 38, 0.55);
}

.stat-suffix {
  font-size: 15px;
  font-weight: 700;
  margin-left: 4px;
  color: #9db4cc;
}

.stat-value {
  font-size: 32px;
  font-weight: 800;
  font-family: var(--vp-font-family-mono, ui-monospace, monospace);
  background: linear-gradient(180deg, #7fd7ff, #2f9fe6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.stat-label {
  font-size: 12.5px;
  color: #8ea9c2;
}

@media (max-width: 960px) {
  .pipeline-bottom {
    flex-direction: column;
    align-items: stretch;
  }

  .pipeline-dots {
    flex-direction: row;
  }

  .pipeline-dot {
    flex: 1;
  }

  .pipeline-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (prefers-reduced-motion: reduce) {
  .core-orbit,
  .core-body {
    animation: none;
  }

  .pkt,
  .pkt-halo {
    display: none;
  }
}

/* ── light mode ─────────────────────────────────────────
   The stage card stays dark (it depicts a live system); the section text
   and stats around it flip to ink-on-paper. */
:root:not(.dark) .pipeline {
  color: #33475c;
}

:root:not(.dark) .pipeline .kicker {
  color: #0e96dd;
}

:root:not(.dark) .pipeline .title {
  color: #0b1b29;
}

:root:not(.dark) .pipeline .sub {
  color: #51687e;
}

:root:not(.dark) .stat {
  border-color: rgba(15, 40, 70, 0.1);
  background: rgba(255, 255, 255, 0.72);
}

:root:not(.dark) .stat-value {
  background-image: linear-gradient(180deg, #1d9bf0, #0e7cc0);
}

:root:not(.dark) .stat-suffix {
  color: #5a7186;
}

:root:not(.dark) .stat-label {
  color: #5a7186;
}
</style>
