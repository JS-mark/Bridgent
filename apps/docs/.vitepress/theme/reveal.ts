import type { Ref } from 'vue'
import { onBeforeUnmount, onMounted, ref } from 'vue'

// Scroll-reveal wiring shared by all home sections: elements with the `.rv`
// class fade/slide in once when they enter the viewport. Stagger with an
// inline `--rv-delay` custom property.
export function useReveal(): Ref<HTMLElement | null> {
  const root = ref<HTMLElement | null>(null)
  let io: IntersectionObserver | null = null

  onMounted(() => {
    const el = root.value
    if (!el)
      return
    io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in')
            io?.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -36px 0px' },
    )
    el.querySelectorAll('.rv').forEach(node => io?.observe(node))
  })

  onBeforeUnmount(() => io?.disconnect())

  return root
}
