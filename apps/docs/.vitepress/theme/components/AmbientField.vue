<script setup lang="ts">
import { useData } from 'vitepress'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

// Ambient constellation field: a quiet star network drifting behind the page.
// Points sit at different depths, near neighbours are linked by faint lines,
// and a shooting star crosses every few seconds. Deliberately low-contrast so
// typography and the terminal stay the protagonists.
const container = ref<HTMLDivElement | null>(null)
const { isDark } = useData()

let cleanup: (() => void) | null = null
onBeforeUnmount(() => cleanup?.())

onMounted(async () => {
  const el = container.value
  if (!el)
    return

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let THREE: typeof import('three')
  try {
    THREE = await import('three')
  }
  catch {
    return
  }

  let renderer: import('three').WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  }
  catch {
    return
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  el.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  camera.position.set(0, 0, 20)

  const dotTex = (() => {
    const size = 64
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx)
      return null
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    grad.addColorStop(0, 'rgba(255,255,255,0.95)')
    grad.addColorStop(0.4, 'rgba(255,255,255,0.3)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
    return new THREE.CanvasTexture(canvas)
  })()

  // ── star points with stored drift phases ──────────────
  const COUNT = 130
  const basePos = new Float32Array(COUNT * 3)
  const pos = new Float32Array(COUNT * 3)
  const phase = new Float32Array(COUNT)
  const stars: { x: number, y: number, z: number }[] = []
  for (let i = 0; i < COUNT; i++) {
    const x = (Math.random() - 0.5) * 38
    const y = (Math.random() - 0.5) * 20
    const z = -2 - Math.random() * 14
    stars.push({ x, y, z })
    basePos[i * 3] = x
    basePos[i * 3 + 1] = y
    basePos[i * 3 + 2] = z
    phase[i] = Math.random() * Math.PI * 2
  }
  const starGeo = new THREE.BufferGeometry()
  const posAttr = new THREE.BufferAttribute(pos, 3)
  starGeo.setAttribute('position', posAttr)
  const starMat = new THREE.PointsMaterial({
    color: 0x7FB8E8,
    size: 0.14,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  })
  if (dotTex)
    starMat.map = dotTex
  scene.add(new THREE.Points(starGeo, starMat))

  // ── faint links between near neighbours ───────────────
  const linkPos: number[] = []
  for (let i = 0; i < COUNT; i++) {
    const a = stars[i]!
    let linked = 0
    for (let j = i + 1; j < COUNT && linked < 2; j++) {
      const b = stars[j]!
      const dx = a.x - b.x
      const dy = a.y - b.y
      const dz = a.z - b.z
      if (dx * dx + dy * dy + dz * dz < 34) {
        linkPos.push(a.x, a.y, a.z, b.x, b.y, b.z)
        linked++
      }
    }
  }
  const linkGeo = new THREE.BufferGeometry()
  linkGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linkPos), 3))
  const linkMat = new THREE.LineBasicMaterial({
    color: 0x4A86B8,
    transparent: true,
    opacity: 0.14,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  scene.add(new THREE.LineSegments(linkGeo, linkMat))

  // ── shooting star ─────────────────────────────────────
  const SHOOT_PTS = 14
  const shootGeo = new THREE.BufferGeometry()
  const shootAttr = new THREE.BufferAttribute(new Float32Array(SHOOT_PTS * 3), 3)
  const shootColors = new Float32Array(SHOOT_PTS * 3)
  for (let i = 0; i < SHOOT_PTS; i++) {
    const f = (1 - i / SHOOT_PTS) ** 2
    shootColors[i * 3] = 0.75 * f
    shootColors[i * 3 + 1] = 0.95 * f
    shootColors[i * 3 + 2] = 1 * f
  }
  shootGeo.setAttribute('position', shootAttr)
  shootGeo.setAttribute('color', new THREE.BufferAttribute(shootColors, 3))
  const shootMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  if (dotTex)
    shootMat.map = dotTex
  const shoot = new THREE.Line(shootGeo, shootMat)
  scene.add(shoot)

  // Additive light streaks vanish on a light page — swap to normal-blended,
  // darker constellation lines and disable the meteor.
  let meteorEnabled = true
  const applyTheme = (dark: boolean) => {
    starMat.color.set(dark ? 0x7FB8E8 : 0x3E6B99)
    starMat.opacity = dark ? 0.55 : 0.45
    linkMat.color.set(dark ? 0x4A86B8 : 0x4A7CA8)
    linkMat.opacity = dark ? 0.14 : 0.18
    linkMat.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending
    linkMat.needsUpdate = true
    meteorEnabled = dark
    if (!dark)
      shootMat.opacity = 0
  }
  applyTheme(isDark.value)
  watch(isDark, applyTheme)

  interface Meteor { active: boolean, t: number, dur: number, wait: number, from: import('three').Vector3, to: import('three').Vector3 }
  const meteor: Meteor = {
    active: false,
    t: 0,
    dur: 1.1,
    wait: 3,
    from: new THREE.Vector3(),
    to: new THREE.Vector3(),
  }
  const tmp = new THREE.Vector3()

  // ── sizing / pointer / loop ───────────────────────────
  let width = 1
  let height = 1
  const resize = () => {
    const rect = el.getBoundingClientRect()
    width = Math.max(rect.width, 1)
    height = Math.max(rect.height, 1)
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }
  const ro = new ResizeObserver(resize)
  ro.observe(el)
  resize()

  let mouseX = 0
  let mouseY = 0
  const onMouse = (e: MouseEvent) => {
    mouseX = e.clientX / window.innerWidth - 0.5
    mouseY = e.clientY / window.innerHeight - 0.5
  }
  window.addEventListener('mousemove', onMouse, { passive: true })

  let inView = true
  const io = new IntersectionObserver((entries) => {
    inView = entries[0]?.isIntersecting ?? true
  })
  io.observe(el)

  const clock = new THREE.Clock()
  let raf = 0
  let time = 0

  const renderFrame = (delta: number) => {
    time += delta

    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = basePos[i * 3]!
      pos[i * 3 + 1] = basePos[i * 3 + 1]! + Math.sin(time * 0.35 + phase[i]!) * 0.35
      pos[i * 3 + 2] = basePos[i * 3 + 2]!
    }
    posAttr.needsUpdate = true

    // meteor lifecycle
    if (!meteor.active) {
      if (meteorEnabled) {
        meteor.wait -= delta
        if (meteor.wait <= 0) {
          meteor.active = true
          meteor.t = 0
          meteor.wait = 3.5 + Math.random() * 4
          meteor.from.set((Math.random() - 0.2) * 22, 7 + Math.random() * 3, -6 - Math.random() * 4)
          meteor.to.set(meteor.from.x - 14 - Math.random() * 8, meteor.from.y - 9 - Math.random() * 4, meteor.from.z + 2)
        }
      }
    }
    else {
      meteor.t += delta / meteor.dur
      if (meteor.t >= 1) {
        meteor.active = false
        shootMat.opacity = 0
      }
      else {
        const p = meteor.t
        shootMat.opacity = meteorEnabled ? Math.sin(p * Math.PI) * 0.9 : 0
        for (let i = 0; i < SHOOT_PTS; i++) {
          const tt = Math.max(0, p - i * 0.022)
          tmp.lerpVectors(meteor.from, meteor.to, tt)
          shootAttr.setXYZ(i, tmp.x, tmp.y, tmp.z)
        }
        shootAttr.needsUpdate = true
      }
    }

    camera.position.x += (mouseX * 1.6 - camera.position.x) * 0.03
    camera.position.y += (-mouseY * 1.1 - camera.position.y) * 0.03
    camera.lookAt(0, 0, -6)

    renderer.render(scene, camera)
  }

  if (reduced) {
    renderFrame(0.016)
  }
  else {
    const loop = () => {
      raf = requestAnimationFrame(loop)
      if (!inView || document.hidden)
        return
      renderFrame(Math.min(clock.getDelta(), 0.05))
    }
    raf = requestAnimationFrame(loop)
  }

  cleanup = () => {
    cancelAnimationFrame(raf)
    ro.disconnect()
    io.disconnect()
    window.removeEventListener('mousemove', onMouse)
    scene.traverse((obj) => {
      const anyObj = obj as unknown as {
        geometry?: { dispose: () => void }
        material?: import('three').Material | import('three').Material[]
      }
      anyObj.geometry?.dispose()
      const mat = anyObj.material
      if (Array.isArray(mat))
        mat.forEach(m => m.dispose())
      else
        mat?.dispose()
    })
    dotTex?.dispose()
    renderer.dispose()
    renderer.domElement.remove()
    cleanup = null
  }
})
</script>

<template>
  <div ref="container" class="ambient-field" aria-hidden="true" />
</template>

<style scoped>
.ambient-field {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.ambient-field :deep(canvas) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
</style>
