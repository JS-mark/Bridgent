<template>
  <svg class="flow-strip" viewBox="0 0 920 74" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="fs-light" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="rgba(83,224,255,0.75)" />
        <stop offset="1" stop-color="rgba(94,227,97,0.75)" />
      </linearGradient>
    </defs>
    <!-- base rail -->
    <path d="M50 37 H 870" class="fs-rail" />
    <!-- moving light segment -->
    <path d="M50 37 H 870" class="fs-rail-light" stroke="url(#fs-light)" />

    <!-- stations -->
    <g v-for="(s, i) in stations" :key="s.label">
      <circle :cx="60 + i * 200" cy="37" r="14" class="fs-halo" :style="{ animationDelay: `${i * 0.45}s` }" />
      <circle :cx="60 + i * 200" cy="37" r="5.5" class="fs-node" :style="{ animationDelay: `${i * 0.45 + 0.15}s` }" />
      <text :x="60 + i * 200" y="66" class="fs-label" text-anchor="middle">{{ s.label }}</text>
    </g>

    <!-- packet riding the whole line -->
    <circle r="4" class="fs-packet">
      <animateMotion begin="0.6s" dur="4s" repeatCount="indefinite" path="M50 37 H 870" />
    </circle>
    <circle r="2.6" class="fs-packet fs-packet-late">
      <animateMotion begin="1.8s" dur="4s" repeatCount="indefinite" path="M50 37 H 870" />
    </circle>
  </svg>
</template>

<script setup lang="ts">
const stations = [
  { label: 'tools/call' },
  { label: 'transport' },
  { label: 'zod parse' },
  { label: 'run()' },
  { label: 'response' },
]
</script>

<style scoped>
.flow-strip {
  width: 100%;
  max-width: 940px;
  margin: 6px auto 14px;
  display: block;
}

.fs-rail {
  stroke: rgba(255, 255, 255, 0.1);
  stroke-width: 1.4;
  fill: none;
}

.fs-rail-light {
  stroke-width: 1.6;
  fill: none;
  stroke-dasharray: 46 874;
  animation: fs-light-run 3.6s linear infinite;
}

@keyframes fs-light-run {
  from { stroke-dashoffset: 920; }
  to { stroke-dashoffset: 0; }
}

.fs-halo {
  fill: none;
  stroke: rgba(83, 224, 255, 0.5);
  stroke-width: 1;
  opacity: 0;
  animation: fs-halo-pulse 2.25s ease-out infinite;
  transform-origin: center;
}

@keyframes fs-halo-pulse {
  0% { opacity: 0.7; transform: scale(0.5); }
  70%, 100% { opacity: 0; transform: scale(1.5); }
}

.fs-node {
  fill: #53e0ff;
  opacity: 0.25;
  animation: fs-node-on 2.25s ease infinite;
}

@keyframes fs-node-on {
  25%, 60% { opacity: 1; fill: #7deaff; }
  100% { opacity: 0.25; }
}

.fs-label {
  fill: #7d99b6;
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  letter-spacing: 0.06em;
}

.fs-packet {
  fill: #eafcff;
  color: #53e0ff;
  filter: drop-shadow(0 0 6px currentColor);
}

.fs-packet-late {
  color: #5ee361;
  fill: #eafff0;
}
</style>
