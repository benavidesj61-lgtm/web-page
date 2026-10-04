/**
 * Product gallery: thumbnails switch the main image, arrow keys navigate, and the native
 * <dialog> lightbox provides Escape-to-close and keeps focus inside while open.
 */
export function initGallery(): void {
  const root = document.querySelector<HTMLElement>('[data-gallery]');
  const dialog = root?.querySelector<HTMLDialogElement>('[data-lightbox]');
  if (!root || !dialog) return;

  const mains = [...root.querySelectorAll<HTMLButtonElement>('[data-gallery-main]')];
  const thumbs = [...root.querySelectorAll<HTMLButtonElement>('[data-gallery-thumb]')];
  const slides = [...dialog.querySelectorAll<HTMLElement>('[data-lightbox-slide]')];
  const counter = dialog.querySelector<HTMLElement>('[data-lightbox-counter]');
  const total = mains.length;
  let current = 0;

  const wrap = (index: number) => (index + total) % total;

  const show = (index: number, { focusThumb = false } = {}) => {
    current = wrap(index);
    mains.forEach((main, i) => (main.hidden = i !== current));
    slides.forEach((slide, i) => (slide.hidden = i !== current));
    thumbs.forEach((thumb, i) => thumb.setAttribute('aria-pressed', String(i === current)));
    if (counter) counter.textContent = `${current + 1} de ${total}`;
    if (focusThumb) thumbs[current]?.focus();
  };

  const KEY_STEPS: Partial<Record<string, number>> = { ArrowRight: 1, ArrowLeft: -1 };

  thumbs.forEach((thumb, index) => {
    thumb.addEventListener('click', () => show(index));
    thumb.addEventListener('keydown', (event) => {
      const step = KEY_STEPS[event.key];
      if (step !== undefined) {
        event.preventDefault();
        show(current + step, { focusThumb: true });
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        show(event.key === 'Home' ? 0 : total - 1, { focusThumb: true });
      }
    });
  });

  mains.forEach((main) => main.addEventListener('click', () => dialog.showModal()));

  dialog.querySelector('[data-lightbox-close]')?.addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-lightbox-prev]')?.addEventListener('click', () => show(current - 1));
  dialog.querySelector('[data-lightbox-next]')?.addEventListener('click', () => show(current + 1));

  dialog.addEventListener('keydown', (event) => {
    const step = KEY_STEPS[event.key];
    if (total > 1 && step !== undefined) show(current + step);
  });

  // A click on the backdrop targets the <dialog> itself, not its content.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  // The image may have changed while open, so focus returns to the visible main image.
  dialog.addEventListener('close', () => mains[current]?.focus());
}
