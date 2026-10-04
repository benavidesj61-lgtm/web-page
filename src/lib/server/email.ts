import type { ContactFields } from '../schemas/contact';
import type { CatalogEntry } from './catalog';

const RESEND_URL = 'https://api.resend.com/emails';
const HTML_ESCAPES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Every user value is escaped before it touches the HTML email. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}

// eslint-disable-next-line no-control-regex -- stripping control characters is the point.
const CONTROL_CHARS = /[\u0000-\u001F\u007F]+/g;

/** Subjects are single-line: line breaks would let a value inject extra email headers. */
export function toHeaderValue(value: string, maxLength = 150): string {
  return value.replace(CONTROL_CHARS, ' ').trim().slice(0, maxLength);
}

export interface ContactEmail {
  subject: string;
  html: string;
  text: string;
}

export function buildContactEmail(
  fields: ContactFields,
  product: CatalogEntry | null,
  receivedAt: Date,
): ContactEmail {
  const productLabel = product ? `${product.nombre} (${product.id})` : 'Ninguno en particular';
  const date = receivedAt.toLocaleString('es-SV', { timeZone: 'America/El_Salvador' });
  const rows: [string, string][] = [
    ['Nombre', fields.nombre],
    ['Correo', fields.correo],
    ['Teléfono', fields.telefono],
    ['Producto de interés', productLabel],
    ['Recibido', date],
  ];

  const htmlRows = rows
    .map(
      ([label, value]) =>
        `<tr><th align="left" style="padding:4px 12px 4px 0">${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`,
    )
    .join('');

  return {
    subject: toHeaderValue(
      `Nueva solicitud de ${fields.nombre}${product ? `: ${product.nombre}` : ''}`,
    ),
    html: `<h1 style="font-size:18px">Nueva solicitud desde el sitio web</h1><table>${htmlRows}</table><h2 style="font-size:16px">Mensaje</h2><p style="white-space:pre-wrap">${escapeHtml(fields.mensaje)}</p>`,
    text: [
      ...rows.map(([label, value]) => `${label}: ${value}`),
      '',
      'Mensaje:',
      fields.mensaje,
    ].join('\n'),
  };
}

interface SendOptions {
  apiKey: string;
  from: string;
  to: string;
  replyTo: string;
  email: ContactEmail;
  idempotencyKey: string;
  fetchImpl?: typeof fetch;
}

/** Returns false on any failure; the caller answers with a generic error and logs only the status. */
export async function sendWithResend({
  apiKey,
  from,
  to,
  replyTo,
  email,
  idempotencyKey,
  fetchImpl = fetch,
}: SendOptions): Promise<boolean> {
  try {
    const response = await fetchImpl(RESEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: replyTo,
        subject: email.subject,
        html: email.html,
        text: email.text,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) console.error('[contacto] Resend respondió con estado', response.status);
    return response.ok;
  } catch {
    console.error('[contacto] No se pudo contactar a Resend');
    return false;
  }
}
