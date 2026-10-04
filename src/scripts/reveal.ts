/** Adds .is-visible to [data-reveal] elements as they enter the viewport (one-shot). */
export function initReveal(): void {
  const elements = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (elements.length === 0) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion || !('IntersectionObserver' in window)) {
    elements.forEach((element) => element.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
  );

  elements.forEach((element) => observer.observe(element));
}
