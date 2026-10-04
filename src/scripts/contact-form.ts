import {
  CONTACT_FIELD_NAMES,
  CONTACT_FORM,
  contactFieldsSchema,
  getFieldErrors,
  isContactFieldName,
  type ContactErrorCode,
  type ContactFieldName,
} from '@/lib/schemas/contact';

/*
 * Browser-side checks only improve the experience: the Netlify Function repeats every one of
 * them (and more) before anything is sent.
 */

const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

interface TurnstileOptions {
  sitekey: string;
  action: string;
  theme: 'light';
  size: 'flexible' | 'compact';
  language: string;
  'refresh-expired': 'auto';
  'response-field': boolean;
  callback: () => void;
  'error-callback': () => void;
  'expired-callback': () => void;
}

interface TurnstileApi {
  render(container: HTMLElement, options: TurnstileOptions): string;
  getResponse(widgetId: string): string | undefined;
  reset(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type Control = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

const ERROR_MESSAGES: Partial<Record<ContactErrorCode, string>> = {
  too_fast: 'Por seguridad, espere unos segundos antes de enviar e inténtelo de nuevo.',
  challenge_failed: 'No pudimos completar la verificación de seguridad. Inténtelo de nuevo.',
  rate_limited:
    'Recibimos varias solicitudes desde su conexión. Inténtelo de nuevo en unos minutos.',
  validation: 'Revise los campos marcados e inténtelo de nuevo.',
};
const GENERIC_ERROR = 'Revise su conexión e inténtelo de nuevo en unos momentos.';
const SERVER_FIELD_MESSAGE = 'Revise este campo.';

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = TURNSTILE_SRC;
    script.async = true;
    script.addEventListener('load', () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile')),
    );
    script.addEventListener('error', () => reject(new Error('turnstile')));
    document.head.append(script);
  });
}

export function initContactForm(): void {
  const form = document.querySelector<HTMLFormElement>('[data-contact-form]');
  const submit = form?.querySelector<HTMLButtonElement>('[data-submit]');
  const submitLabel = submit?.querySelector<HTMLElement>('[data-submit-label]');
  const submitIcon = submit?.querySelector<HTMLElement>('[data-submit-icon]');
  const status = form?.querySelector<HTMLElement>('[data-form-status]');
  const widget = form?.querySelector<HTMLElement>('[data-turnstile]');
  const widgetError = form?.querySelector<HTMLElement>('[data-field="turnstile"] [data-error]');
  const errorBox = document.querySelector<HTMLElement>('[data-form-error]');
  const errorMessage = errorBox?.querySelector<HTMLElement>('[data-form-error-message]');
  if (
    !form ||
    !submit ||
    !submitLabel ||
    !submitIcon ||
    !status ||
    !widget ||
    !widgetError ||
    !errorBox ||
    !errorMessage
  ) {
    return;
  }

  const endpoint = form.dataset['endpoint'] ?? CONTACT_FORM.endpoint;
  const idleLabel = submitLabel.textContent ?? '';
  const startedAt = Date.now();
  let turnstile: TurnstileApi | undefined;
  let widgetId: string | undefined;

  const getControl = (name: string) => form.elements.namedItem(name) as Control | null;
  const readFields = () =>
    Object.fromEntries(CONTACT_FIELD_NAMES.map((name) => [name, getControl(name)?.value ?? '']));

  preselectProduct(getControl('producto'));

  const showFieldError = (name: ContactFieldName, message: string) => {
    const control = getControl(name);
    const errorElement = form.querySelector<HTMLElement>(`[data-field="${name}"] [data-error]`);
    if (!control || !errorElement) return;
    errorElement.textContent = message;
    if (message) control.setAttribute('aria-invalid', 'true');
    else control.removeAttribute('aria-invalid');
  };

  /** Validates the whole form with the shared schema and paints one message per field. */
  const validate = (only?: ContactFieldName): ContactFieldName[] => {
    const result = contactFieldsSchema.safeParse(readFields());
    const errors = result.success ? {} : getFieldErrors(result.error.issues);
    const names = only ? [only] : CONTACT_FIELD_NAMES;
    names.forEach((name) => showFieldError(name, errors[name] ?? ''));
    return CONTACT_FIELD_NAMES.filter((name) => errors[name] !== undefined);
  };

  CONTACT_FIELD_NAMES.forEach((name) => {
    const control = getControl(name);
    // Validate on blur only once something was typed, then re-validate live while it is fixed.
    control?.addEventListener('blur', () => {
      if (control.value.trim() !== '') validate(name);
    });
    control?.addEventListener('input', () => {
      if (control.hasAttribute('aria-invalid')) validate(name);
    });
  });

  const setWidgetError = (message: string) => {
    widgetError.textContent = message;
  };

  const sitekey = widget.dataset['sitekey'];
  if (sitekey) {
    loadTurnstile()
      .then((api) => {
        turnstile = api;
        widgetId = api.render(widget, {
          sitekey,
          action: widget.dataset['action'] ?? CONTACT_FORM.turnstileAction,
          theme: 'light',
          // The regular widget needs 300px; narrow phones get the compact (150px) version.
          size: widget.clientWidth < 300 ? 'compact' : 'flexible',
          language: 'es',
          'refresh-expired': 'auto',
          // The token is read with getResponse() and sent as JSON; no hidden input is needed.
          'response-field': false,
          callback: () => setWidgetError(''),
          'error-callback': () =>
            setWidgetError('La verificación de seguridad falló. Recargue la página.'),
          'expired-callback': () => setWidgetError(''),
        });
      })
      .catch(() =>
        setWidgetError(
          'No se pudo cargar la verificación de seguridad. Revise su conexión o desactive bloqueadores de contenido.',
        ),
      );
  }

  const setSubmitting = (submitting: boolean) => {
    submit.disabled = submitting;
    form.setAttribute('aria-busy', String(submitting));
    submitLabel.textContent = submitting ? 'Enviando…' : idleLabel;
    submitIcon.hidden = submitting;
  };

  const showError = (message: string) => {
    errorMessage.textContent = message;
    errorBox.hidden = false;
    errorBox.focus();
  };

  // Tokens are single-use: any failed attempt needs a fresh one.
  const resetChallenge = () => {
    if (turnstile && widgetId !== undefined) turnstile.reset(widgetId);
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.hidden = true;

    const invalid = validate();
    if (invalid.length > 0) {
      status.textContent = `Revise ${invalid.length === 1 ? 'el campo marcado' : `los ${invalid.length} campos marcados`}.`;
      const [first] = invalid;
      if (first) getControl(first)?.focus();
      return;
    }

    const token = turnstile && widgetId !== undefined ? turnstile.getResponse(widgetId) : '';
    if (!token) {
      const message = 'Complete la verificación de seguridad antes de enviar.';
      setWidgetError(message);
      status.textContent = message;
      widget.scrollIntoView({ block: 'center' });
      return;
    }

    if (Date.now() - startedAt < CONTACT_FORM.minFillMs) {
      showError(ERROR_MESSAGES.too_fast ?? GENERIC_ERROR);
      return;
    }

    const honeypot = getControl(CONTACT_FORM.honeypotField)?.value ?? '';
    const body = {
      ...readFields(),
      [CONTACT_FORM.turnstileField]: token,
      [CONTACT_FORM.honeypotField]: honeypot,
    };

    setSubmitting(true);
    status.textContent = 'Enviando su solicitud…';
    let code: string | undefined;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
        credentials: 'same-origin',
      });
      if (response.ok) {
        status.textContent = 'Solicitud enviada. Redirigiendo…';
        window.location.assign(CONTACT_FORM.successPath);
        return;
      }
      const result = readErrorResponse(await response.json().catch(() => null));
      result.fields.forEach((name) => showFieldError(name, SERVER_FIELD_MESSAGE));
      code = result.error;
    } catch {
      code = undefined;
    }

    setSubmitting(false);
    resetChallenge();
    status.textContent = '';
    showError(messageFor(code));
  });
}

function messageFor(code: string | undefined): string {
  return (
    (code !== undefined && Object.hasOwn(ERROR_MESSAGES, code)
      ? ERROR_MESSAGES[code as ContactErrorCode]
      : undefined) ?? GENERIC_ERROR
  );
}

/** The response is untrusted input too: only known codes and field names are used. */
function readErrorResponse(value: unknown): { error?: string; fields: ContactFieldName[] } {
  if (typeof value !== 'object' || value === null) return { fields: [] };
  const error = 'error' in value && typeof value.error === 'string' ? value.error : undefined;
  const rawFields = 'fields' in value && Array.isArray(value.fields) ? value.fields : [];
  const fields = rawFields.filter(
    (field): field is ContactFieldName => typeof field === 'string' && isContactFieldName(field),
  );
  return error === undefined ? { fields } : { error, fields };
}

/** `/contacto/?producto=<slug>` preselects that product only if it exists in the selector. */
function preselectProduct(select: Control | null): void {
  const slug = new URLSearchParams(window.location.search).get('producto');
  if (!slug || !(select instanceof HTMLSelectElement)) return;
  const exists = [...select.options].some((option) => option.value === slug && slug !== '');
  if (exists) select.value = slug;
}
