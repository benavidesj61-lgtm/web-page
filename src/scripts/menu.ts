const DESKTOP_QUERY = '(min-width: 1024px)';

/** Disclosure-pattern mobile menu: no focus trap, Escape and outside clicks close it. */
export function initMenu(): void {
  const header = document.querySelector<HTMLElement>('[data-site-header]');
  const toggle = header?.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const panel = header?.querySelector<HTMLElement>('[data-menu-panel]');
  const label = toggle?.querySelector<HTMLElement>('[data-menu-label]');
  const iconOpen = toggle?.querySelector<HTMLElement>('[data-menu-icon-open]');
  const iconClose = toggle?.querySelector<HTMLElement>('[data-menu-icon-close]');
  if (!header || !toggle || !panel || !label || !iconOpen || !iconClose) return;

  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

  const setOpen = (open: boolean, { restoreFocus = false } = {}) => {
    toggle.setAttribute('aria-expanded', String(open));
    label.textContent = open ? 'Cerrar menú' : 'Abrir menú';
    iconOpen.classList.toggle('hidden', open);
    iconClose.classList.toggle('hidden', !open);

    if (open) {
      panel.hidden = false;
      // Wait one frame so the transition starts from the closed state instead of jumping.
      requestAnimationFrame(() => panel.setAttribute('data-open', ''));
    } else {
      panel.removeAttribute('data-open');
      panel.hidden = true;
      if (restoreFocus) toggle.focus();
    }
  };

  toggle.addEventListener('click', () => setOpen(!isOpen()));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) setOpen(false, { restoreFocus: true });
  });

  document.addEventListener('click', (event) => {
    if (isOpen() && event.target instanceof Node && !header.contains(event.target)) {
      setOpen(false);
    }
  });

  // In-page anchors (e.g. /#preguntas-frecuentes) do not reload the page, so close explicitly.
  panel.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a')) setOpen(false);
  });

  window.matchMedia(DESKTOP_QUERY).addEventListener('change', (event) => {
    if (event.matches && isOpen()) setOpen(false);
  });
}
