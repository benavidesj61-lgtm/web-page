/** Disclosure-pattern mobile menu: toggle button + panel, closes on Escape, outside click or resize. */
export function initMobileMenu(): void {
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const panelId = toggle?.getAttribute('aria-controls');
  const panel = panelId ? document.getElementById(panelId) : null;
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!toggle || !panel || !header) return;

  const openIcon = toggle.querySelector<HTMLElement>('[data-menu-icon="open"]');
  const closeIcon = toggle.querySelector<HTMLElement>('[data-menu-icon="close"]');
  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

  const setOpen = (open: boolean) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    panel.dataset['open'] = String(open);
    if (openIcon) openIcon.hidden = open;
    if (closeIcon) closeIcon.hidden = !open;
  };

  toggle.addEventListener('click', () => setOpen(!isOpen()));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) {
      setOpen(false);
      toggle.focus();
    }
  });

  document.addEventListener('click', (event) => {
    if (isOpen() && event.target instanceof Node && !header.contains(event.target)) {
      setOpen(false);
    }
  });

  // Closing when focus leaves the header avoids focus landing on content hidden behind the panel.
  header.addEventListener('focusout', (event) => {
    if (isOpen() && event.relatedTarget instanceof Node && !header.contains(event.relatedTarget)) {
      setOpen(false);
    }
  });

  panel.querySelectorAll('[data-menu-link]').forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });

  window.matchMedia('(min-width: 64rem)').addEventListener('change', (event) => {
    if (event.matches) setOpen(false);
  });
}
