import { CONTACT_FORM } from '@/data/site';

type FieldName = 'nombre' | 'correo' | 'telefono' | 'mensaje';
type Control = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Local numbers have 8 digits; international ones up to 15. Separators and "+" are ignored.
const PHONE_PATTERN = /^\+?\d{8,15}$/;

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
      : PHONE_PATTERN.test(value.replace(/[\s().-]/g, ''))
        ? ''
        : 'Escriba un teléfono válido de al menos 8 dígitos, por ejemplo 7529-2926.',
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
  const submit = form?.querySelector<HTMLButtonElement>('[data-submit]');
  const submitLabel = submit?.querySelector<HTMLElement>('[data-submit-label]');
  const submitIcon = submit?.querySelector<HTMLElement>('[data-submit-icon]');
  const status = form?.querySelector<HTMLElement>('[data-form-status]');
  const errorBox = document.querySelector<HTMLElement>('[data-form-error]');
  if (!form || !submit || !submitLabel || !submitIcon || !status || !errorBox) return;

  // Native validation stays active when JS fails to load; with JS our accessible messages replace it.
  form.noValidate = true;
  const idleLabel = submitLabel.textContent ?? '';

  const getControl = (name: string) => form.elements.namedItem(name) as Control | null;

  preselectProduct(getControl('producto'));

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
    // Validate on blur only once something was typed, then re-validate live while it is fixed.
    control?.addEventListener('blur', () => {
      if (control.value.trim() !== '') validateField(name);
    });
    control?.addEventListener('input', () => {
      if (control.hasAttribute('aria-invalid')) validateField(name);
    });
  });

  const setSubmitting = (submitting: boolean) => {
    submit.disabled = submitting;
    form.setAttribute('aria-busy', String(submitting));
    submitLabel.textContent = submitting ? 'Enviando…' : idleLabel;
    submitIcon.hidden = submitting;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.hidden = true;

    const invalid = FIELD_NAMES.filter((name) => validateField(name) !== '');
    if (invalid.length > 0) {
      status.textContent = `Revise ${invalid.length === 1 ? 'el campo marcado' : `los ${invalid.length} campos marcados`}.`;
      const [first] = invalid;
      if (first) getControl(first)?.focus();
      return;
    }

    const data = new FormData(form);
    // Bots fill every field; skip the request but behave as if it worked.
    if (String(data.get(CONTACT_FORM.honeypotField) ?? '') !== '') {
      window.location.assign(CONTACT_FORM.successPath);
      return;
    }

    setSubmitting(true);
    status.textContent = 'Enviando su solicitud…';
    try {
      const body = new URLSearchParams();
      data.forEach((value, key) => body.append(key, String(value)));
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      status.textContent = 'Solicitud enviada. Redirigiendo…';
      window.location.assign(CONTACT_FORM.successPath);
    } catch (error) {
      console.error('[contacto] Error al enviar el formulario', error);
      setSubmitting(false);
      status.textContent = '';
      errorBox.hidden = false;
      errorBox.focus();
    }
  });
}

/** `/contacto/?producto=<slug>` preselects that product so the visitor does not have to find it. */
function preselectProduct(select: Control | null): void {
  const slug = new URLSearchParams(window.location.search).get('producto');
  if (!slug || !(select instanceof HTMLSelectElement)) return;
  const option = [...select.options].find((candidate) => candidate.dataset['slug'] === slug);
  if (option) select.value = option.value;
}
