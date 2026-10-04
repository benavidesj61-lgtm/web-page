import { describe, expect, it } from 'vitest';
import {
  contactFieldsSchema,
  contactRequestSchema,
  getFieldErrors,
} from '../src/lib/schemas/contact';

const valid = {
  nombre: '  María José López ',
  correo: 'maria@empresa.com',
  telefono: '+503 7529-2926',
  producto: 'lattafa-yara-100-ml',
  mensaje: 'Necesito 25 sets para clientes.',
};

const errorsOf = (input: unknown) => {
  const result = contactFieldsSchema.safeParse(input);
  return result.success ? {} : getFieldErrors(result.error.issues);
};

describe('contactFieldsSchema', () => {
  it('accepts valid data and trims it', () => {
    const result = contactFieldsSchema.safeParse(valid);
    expect(result.success).toBe(true);
    expect(result.data?.nombre).toBe('María José López');
  });

  it('reports the "empty" message first for blank required fields', () => {
    expect(errorsOf({ ...valid, nombre: '   ', correo: '', telefono: '', mensaje: '' })).toEqual({
      nombre: 'Escriba su nombre.',
      correo: 'Escriba su correo electrónico.',
      telefono: 'Escriba su número de teléfono.',
      mensaje: 'Cuéntenos en qué podemos ayudarle.',
    });
  });

  it('rejects unexpected fields instead of ignoring them', () => {
    expect(contactFieldsSchema.safeParse({ ...valid, precio: 1, rol: 'admin' }).success).toBe(
      false,
    );
  });

  it.each([
    ['nombre', 'Robert<script>'],
    ['nombre', 'a'.repeat(101)],
    ['correo', 'no-es-correo'],
    ['correo', `${'a'.repeat(120)}@x.com`],
    ['telefono', '123'],
    ['telefono', '7529-2926; DROP TABLE'],
    ['producto', '../../etc/passwd'],
    ['producto', 'Lattafa Yara'],
    ['mensaje', 'corto'],
    ['mensaje', 'x'.repeat(2001)],
    ['mensaje', 'Hola\u0000mundo con control'],
  ])('rejects invalid %s: %s', (field, value) => {
    expect(Object.keys(errorsOf({ ...valid, [field]: value }))).toContain(field);
  });

  it('allows an empty product and multi-line messages', () => {
    expect(
      contactFieldsSchema.safeParse({ ...valid, producto: '', mensaje: 'Hola,\nnecesito ayuda.' })
        .success,
    ).toBe(true);
  });
});

describe('contactRequestSchema', () => {
  it('requires the Turnstile token and accepts the honeypot', () => {
    const base = { ...valid, 'sitio-web': '' };
    expect(contactRequestSchema.safeParse(base).success).toBe(false);
    expect(
      contactRequestSchema.safeParse({ ...base, 'cf-turnstile-response': 'token' }).success,
    ).toBe(true);
  });
});
