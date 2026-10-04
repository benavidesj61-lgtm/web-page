# Seguridad · LE SCENT

Este documento resume las medidas de seguridad del sitio y la lista de verificación que debe
completarse antes de cada despliegue. Referencias: OWASP Top 10 y OWASP ASVS.

## Arquitectura y superficie de ataque

- Todas las páginas son **HTML estático** generado por Astro: no hay servidor, base de datos, sesiones ni panel de administración.
- El único código de servidor es la **Netlify Function `/api/contacto/`** (`netlify/functions/contacto.ts` + `src/lib/server/`). Recibe el formulario de contacto y envía un correo mediante Resend.
- Hay dos servicios de terceros en el navegador:
  - **Cloudflare Turnstile**, solo en /contacto.
  - **El mapa embebido de Google Maps.**

## Medidas implementadas

| Área            | Medida                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HTTPS           | Netlify sirve todo por HTTPS y redirige HTTP con 301. HSTS: `max-age=63072000; includeSubDomains; preload`. `upgrade-insecure-requests` en la CSP.                                                                                                                                                                                                                                                                                       |
| Headers         | CSP estricta sin `'unsafe-inline'` ni `'unsafe-eval'`, más `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'` y `form-action 'self'`. También: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, Permissions-Policy restrictiva y `Cross-Origin-Opener-Policy: same-origin`. La API agrega `Cache-Control: no-store` y su propia CSP (`default-src 'none'`). |
| Código en línea | No hay scripts, estilos, `style=""` ni manejadores `on*=` en línea. Astro emite todo como archivos externos, y por eso la CSP puede ser `'self'`.                                                                                                                                                                                                                                                                                        |
| Secretos        | Solo en variables de entorno (panel de Netlify). `.env` está ignorado en Git y `.env.example` contiene solo nombres. Solo `PUBLIC_TURNSTILE_SITE_KEY` llega al navegador, y es pública por diseño. `npm run check:dist` comprueba que ningún secreto aparezca en `dist/`.                                                                                                                                                                |
| Git             | Hook pre-commit con gitleaks; gitleaks sobre todo el historial en CI.                                                                                                                                                                                                                                                                                                                                                                    |
| Validación      | Esquema Zod de lista blanca (`strictObject`) compartido entre el navegador y el servidor. El servidor rechaza campos desconocidos y valida tipos, formatos y longitudes. Los parámetros de URL del catálogo se validan contra listas permitidas o tienen un límite de longitud.                                                                                                                                                          |
| Manipulación    | El formulario solo envía el _slug_ del producto; el nombre se lee del índice del catálogo. Los campos ocultos no se consideran confiables.                                                                                                                                                                                                                                                                                               |
| Antibot         | Turnstile verificado en el servidor, incluida la acción y el dominio. Honeypot con respuesta de éxito silenciosa. Mínimo de 3 s medido con la marca de tiempo de Cloudflare (no falsificable desde el cliente). Límite de 5 envíos por IP cada 15 minutos con Netlify Blobs; solo se guardan hashes de las IP.                                                                                                                           |
| CSRF / CORS     | Solo `POST` (405 en otro caso) y comprobación del header `Origin` del mismo sitio. Solo acepta JSON, sin headers CORS, así que otro dominio no puede llamar la API desde un navegador. Cuerpo máximo de 16 KB.                                                                                                                                                                                                                           |
| Errores         | Códigos genéricos (`validation`, `challenge_failed`, `rate_limited`, `unavailable`…), sin trazas ni detalles internos. Los logs registran el motivo, sin datos personales ni secretos.                                                                                                                                                                                                                                                   |
| Escape          | Escape automático de Astro. `set:html` solo se usa con constantes internas. En el correo se escapa cada valor y el asunto se limita a una línea, para evitar la inyección de headers.                                                                                                                                                                                                                                                    |
| Dependencias    | `npm ci` en cada despliegue, `package-lock.json` versionado, Dependabot semanal y `npm audit --audit-level=high` en CI. El adaptador de Netlify para Astro se descartó porque arrastra dependencias con vulnerabilidades altas sin parche.                                                                                                                                                                                               |
| Pruebas         | 45 pruebas (Vitest) que cubren cada camino de rechazo del endpoint, el escape y el límite de envíos.                                                                                                                                                                                                                                                                                                                                     |

**Reglas que aún no aplican** (base de datos con RLS, autenticación, cookies de sesión, contraseñas,
subida de archivos y cifrado a nivel de aplicación) están documentadas en `CLAUDE.md` para aplicarse
en cuanto el proyecto incorpore esas funciones.

## Lista de verificación antes de cada despliegue

- [ ] `npm run validate` sin errores ni advertencias. Incluye lint, formato, pruebas, build y la revisión de `dist/`.
- [ ] `npm audit --audit-level=high` sin vulnerabilidades altas ni críticas.
- [ ] `gitleaks git --redact .` sin hallazgos.
- [ ] Variables configuradas en Netlify (**Site configuration → Environment variables**): `PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `CONTACT_FROM_EMAIL` y, opcionalmente, `CONTACT_TO_EMAIL`. Ninguna llave privada lleva el prefijo `PUBLIC_`.
- [ ] En Turnstile, la lista de dominios permitidos incluye solo el dominio de producción y, si se usan, los de _deploy preview_.
- [ ] En Resend, el dominio del remitente está verificado (SPF y DKIM).
- [ ] En el _deploy preview_, abra la consola del navegador en inicio, catálogo, un producto y contacto, y confirme que no hay violaciones de CSP. Envíe un formulario real y confirme que llega el correo.
- [ ] Revise los headers con `curl -I https://<dominio>/` o con securityheaders.com.
- [ ] Solo cuando el dominio definitivo esté funcionando en HTTPS, con todos sus subdominios: considere inscribirlo en hstspreload.org. Es difícil de revertir.

## Si se expone un secreto

1. **Revóquelo primero** en el proveedor (Cloudflare o Resend) y genere uno nuevo. Purgar el historial sin rotar la llave no sirve, porque pudo haber sido copiada.
2. Actualice la variable en Netlify y vuelva a desplegar.
3. Después, elimínelo del historial con `git filter-repo --replace-text` y fuerce la actualización del repositorio remoto, en coordinación con todas las personas que tengan copias.
4. Revise los registros del proveedor en busca de uso indebido.

## Reportar una vulnerabilidad

Escriba a **lescentsv@gmail.com** con el asunto «Seguridad». No publique los detalles hasta que el
problema esté corregido.
