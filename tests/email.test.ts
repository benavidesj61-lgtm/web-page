import { describe, expect, it } from 'vitest';
import { buildContactEmail, escapeHtml, toHeaderValue } from '../src/lib/server/email';

const fields = {
  nombre: 'Ana <b>',
  correo: 'ana@empresa.com',
  telefono: '7529-2926',
  producto: 'lattafa-yara-100-ml',
  mensaje: '<script>alert("x")</script>\nSegunda línea',
};

describe('email output', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml(`<img src=x onerror="a">'&`)).toBe(
      '&lt;img src=x onerror=&quot;a&quot;&gt;&#39;&amp;',
    );
  });

  it('never puts raw user markup in the HTML body', () => {
    const email = buildContactEmail(
      fields,
      { slug: 'lattafa-yara-100-ml', id: 'LS-011', nombre: 'Lattafa Yara' },
      new Date(),
    );
    expect(email.html).not.toContain('<script>');
    expect(email.html).not.toContain('<b>');
    expect(email.html).toContain('&lt;script&gt;');
    expect(email.html).toContain('Lattafa Yara (LS-011)');
    expect(email.text).toContain('Segunda línea');
  });

  it('keeps the subject on one line (no header injection)', () => {
    expect(toHeaderValue('Hola\r\nBcc: victima@x.com')).toBe('Hola Bcc: victima@x.com');
    const email = buildContactEmail({ ...fields, nombre: 'Ana\r\nBcc: x@y.com' }, null, new Date());
    expect(email.subject).not.toMatch(/[\r\n]/);
  });
});
