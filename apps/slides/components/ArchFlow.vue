<template>
  <svg class="archflow" viewBox="0 0 920 320" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="af-core" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="rgba(32,168,247,0.14)" />
        <stop offset="1" stop-color="rgba(94,227,97,0.1)" />
      </linearGradient>
      <filter id="af-glow" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="5" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <!-- rails: sources → core -->
    <path
      v-for="(p, i) in srcRails" :key="`sr${i}`" class="af-rail af-in" :style="{ animationDelay: `${0.5 + i * 0.08}s` }"
      :d="`M142 ${52 + i * 54} C 240 ${52 + i * 54}, 250 160, 340 158`"
    />
    <!-- rails: core → transports -->
    <path
      v-for="(p, i) in 3" :key="`tr${i}`" class="af-rail af-in" :style="{ animationDelay: `${1.1 + i * 0.08}s` }"
      :d="`M560 ${160 + (i - 1) * 22} C 590 ${160 + (i - 1) * 22}, 595 ${70 + i * 75}, 618 ${70 + i * 75}`"
    />
    <!-- rails: transports → hosts -->
    <path
      v-for="(p, i) in 4" :key="`hr${i}`" class="af-rail af-in" :style="{ animationDelay: `${1.5 + i * 0.08}s` }"
      :d="`M748 ${70 + (i % 3) * 75} C 775 ${70 + (i % 3) * 75}, 778 ${36 + i * 74}, 798 ${36 + i * 74}`"
    />

    <!-- flowing data packets -->
    <circle
      v-for="(p, i) in 5" :key="`sp${i}`" class="af-dot af-dot-cyan" r="3.2"
    >
      <animateMotion
        :begin="`${0.9 + i * 0.35}s`" dur="2.6s" repeatCount="indefinite"
        :path="`M142 ${52 + i * 54} C 240 ${52 + i * 54}, 250 160, 340 158`"
      />
    </circle>
    <circle v-for="(p, i) in 3" :key="`tp${i}`" class="af-dot af-dot-green" r="3.2">
      <animateMotion
        :begin="`${1.5 + i * 0.4}s`" dur="2.2s" repeatCount="indefinite"
        :path="`M560 ${160 + (i - 1) * 22} C 590 ${160 + (i - 1) * 22}, 595 ${70 + i * 75}, 618 ${70 + i * 75}`"
      />
    </circle>
    <circle v-for="(p, i) in 4" :key="`hp${i}`" class="af-dot af-dot-cyan" r="3.2">
      <animateMotion
        :begin="`${1.9 + i * 0.3}s`" dur="1.9s" repeatCount="indefinite"
        :path="`M748 ${70 + (i % 3) * 75} C 775 ${70 + (i % 3) * 75}, 778 ${36 + i * 74}, 798 ${36 + i * 74}`"
      />
    </circle>

    <!-- source column -->
    <g v-for="(s, i) in sources" :key="s" class="af-in" :style="{ animationDelay: `${0.1 + i * 0.08}s` }">
      <rect x="22" :y="34 + i * 54" width="120" height="38" rx="8" class="af-box" />
      <text x="82" :y="58 + i * 54" class="af-text">{{ s }}</text>
    </g>
    <text x="82" y="22" class="af-col-title" text-anchor="middle">SOURCES</text>

    <!-- core -->
    <g class="af-in" style="animation-delay: 0.7s">
      <rect x="340" y="96" width="220" height="128" rx="14" class="af-core-box" fill="url(#af-core)" filter="url(#af-glow)" />
      <text x="450" y="142" class="af-core-title" text-anchor="middle">@bridgent/core</text>
      <text x="450" y="168" class="af-core-sub" text-anchor="middle">defineTool · registerTools</text>
      <text x="450" y="190" class="af-core-sub" text-anchor="middle">Zod shape → MCP schema</text>
    </g>

    <!-- transport column -->
    <g v-for="(t, i) in transports" :key="t" class="af-in" :style="{ animationDelay: `${1.0 + i * 0.08}s` }">
      <rect x="620" :y="52 + i * 75" width="128" height="36" rx="8" class="af-box af-box-green" />
      <text x="684" :y="75 + i * 75" class="af-text">{{ t }}</text>
    </g>
    <text x="684" y="40" class="af-col-title" text-anchor="middle">TRANSPORTS</text>

    <!-- host column -->
    <g v-for="(h, i) in hosts" :key="h" class="af-in" :style="{ animationDelay: `${1.4 + i * 0.08}s` }">
      <rect x="800" :y="18 + i * 74" width="100" height="36" rx="8" class="af-box af-box-green" />
      <text x="850" :y="41 + i * 74" class="af-text af-text-sm">{{ h }}</text>
    </g>
    <text x="850" y="308" class="af-col-title" text-anchor="middle">HOSTS</text>
  </svg>
</template>

<script setup lang="ts">
const sources = ['Zod', 'OpenAPI', 'Prisma', 'Drizzle', 'tRPC']
const transports = ['stdio', 'Streamable HTTP', 'Web fetch']
const hosts = ['Claude Code', 'Cursor', 'Codex', 'Gemini CLI']
const srcRails = [0, 1, 2, 3, 4]
</script>

<style scoped>
.archflow {
  width: 100%;
  max-width: 980px;
  margin: 0 auto;
  display: block;
}

.af-in {
  opacity: 0;
  animation: af-enter 0.55s cubic-bezier(0.2, 0.7, 0.3, 1) both;
}

@keyframes af-enter {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: none; }
}

.af-box {
  fill: rgba(255, 255, 255, 0.03);
  stroke: rgba(255, 255, 255, 0.12);
  stroke-width: 1;
}

.af-box-green {
  stroke: rgba(94, 227, 97, 0.3);
}

.af-core-box {
  stroke: rgba(94, 227, 97, 0.5);
  stroke-width: 1.2;
  animation: af-core-pulse 3s ease-in-out 1.4s infinite;
}

@keyframes af-core-pulse {
  50% { stroke: rgba(83, 224, 255, 0.85); }
}

.af-text {
  fill: #c9def1;
  font-size: 13.5px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  text-anchor: middle;
}

.af-text-sm {
  font-size: 11.5px;
}

.af-core-title {
  fill: #edf6fd;
  font-size: 16px;
  font-weight: 700;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.af-core-sub {
  fill: #8fb2ce;
  font-size: 11.5px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.af-col-title {
  fill: #5b7690;
  font-size: 10px;
  letter-spacing: 0.22em;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.af-rail {
  fill: none;
  stroke: rgba(120, 180, 235, 0.22);
  stroke-width: 1.2;
  stroke-dasharray: 5 6;
  animation: af-enter 0.55s both, af-rail-flow 1.2s linear infinite;
}

@keyframes af-rail-flow {
  to { stroke-dashoffset: -11; }
}

.af-dot {
  filter: drop-shadow(0 0 5px currentColor);
}

.af-dot-cyan {
  fill: #53e0ff;
  color: #53e0ff;
}

.af-dot-green {
  fill: #5ee361;
  color: #5ee361;
}
</style>
