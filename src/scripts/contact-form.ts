import { buildWhatsAppUrl } from '@/utils/whatsapp';

type FieldName = 'nombre' | 'correo' | 'telefono' | 'mensaje';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Salvadoran numbers have 8 digits starting with 2, 6 or 7; +503 prefix and separators are optional.
const PHONE_PATTERN = /^(?:\+?503)?[267]\d{7}$/;

const VALIDATORS: Record<FieldName, (value: string) => string> = {
  nombre: (value) =>
    value.length === 0
      ? 'Escriba su nombre.'
      : value.length < 2
        ? 'El nombre debe tener al menos 2 caracteres.'
        : '',
  correo: (value) =>
    value.length === 0
      ? 'Escriba su correo electrónico.'
      : EMAIL_PATTERN.test(value)
        ? ''
        : 'Escriba un correo válido, por ejemplo nombre@empresa.com.',
  telefono: (value) =>
    value.length === 0
      ? 'Escriba su número de teléfono.'
      : PHONE_PATTERN.test(value.replace(/[\s()-]/g, ''))
        ? ''
        : 'Escriba un teléfono de 8 dígitos, por ejemplo 7529-2926.',
  mensaje: (value) =>
    value.length === 0
      ? 'Cuéntenos en qué podemos ayudarle.'
      : value.length < 10
        ? 'El mensaje debe tener al menos 10 caracteres.'
        : '',
};

const FIELD_NAMES = Object.keys(VALIDATORS) as FieldName[];

export function initContactForm(): void {
  const form = document.querySelector<HTMLFormElement>('[data-contact-form]');
  const summary = document.querySelector<HTMLElement>('[data-error-summary]');
  const summaryList = summary?.querySelector<HTMLUListElement>('ul');
  const success = document.querySelector<HTMLElement>('[data-form-success]');
  const successLink = success?.querySelector<HTMLAnchorElement>('a');
  if (!form || !summary || !summaryList || !success || !successLink) return;

  const getControl = (name: string) =>
    form.elements.namedItem(name) as
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;

  const validateField = (name: FieldName): string => {
    const control = getControl(name);
    const errorElement = form.querySelector<HTMLElement>(`[data-field="${name}"] [data-error]`);
    if (!control || !errorElement) return '';
    const message = VALIDATORS[name](control.value.trim());
    errorElement.textContent = message;
    if (message) control.setAttribute('aria-invalid', 'true');
    else control.removeAttribute('aria-invalid');
    return message;
  };

  FIELD_NAMES.forEach((name) => {
    const control = getControl(name);
    // Validate on blur only once the user typed something, then re-validate live while fixing it.
    control?.addEventListener('blur', () => {
      if (control.value.trim() !== '') validateField(name);
    });
    control?.addEventListener('input', () => {
      if (control.hasAttribute('aria-invalid')) validateField(name);
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    success.hidden = true;

    const errors = FIELD_NAMES.map((name) => ({ name, message: validateField(name) })).filter(
      (error) => error.message,
    );

    if (errors.length > 0) {
      summaryList.replaceChildren(
        ...errors.map(({ name, message }) => {
          const item = document.createElement('li');
          const link = document.createElement('a');
          link.href = `#${getControl(name)?.id ?? name}`;
          link.textContent = message;
          link.className = 'underline underline-offset-4 hover:no-underline';
          item.append(link);
          return item;
        }),
      );
      summary.hidden = false;
      summary.focus();
      return;
    }

    summary.hidden = true;
    const value = (name: string) => getControl(name)?.value.trim() ?? '';
    const message = [
      'Hola, LE SCENT. Les escribo desde el formulario de contacto del sitio web.',
      '',
      `Nombre: ${value('nombre')}`,
      `Correo: ${value('correo')}`,
      `Teléfono: ${value('telefono')}`,
      `Tipo de consulta: ${value('tipo')}`,
      '',
      value('mensaje'),
    ].join('\n');

    const url = buildWhatsAppUrl(message);
    successLink.href = url;
    success.hidden = false;
    window.open(url, '_blank', 'noopener');
    form.reset();
    success.focus();
  });
}
