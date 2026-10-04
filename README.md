# LE SCENT · Sitio web y catálogo

Sitio corporativo y catálogo de **LE SCENT**, perfumes y decants originales en El Salvador.
Está construido con Astro (sitio estático), TypeScript y Tailwind CSS, más una sola función de
servidor en Netlify para el formulario de contacto. Obtiene 95 o más en Lighthouse en
Rendimiento, Accesibilidad, Buenas Prácticas y SEO. Las medidas de seguridad están en
[`SECURITY.md`](SECURITY.md).

- **Inicio**: hero, colecciones, productos destacados, «Por qué elegirnos», preguntas frecuentes y llamada a la acción.
- **Catálogo** (`/catalogo/`): filtros por categoría, búsqueda, ordenamiento y «Cargar más». Los filtros se guardan en la URL.
- **Detalle de producto** (`/catalogo/<slug>/`): galería con vista ampliada, precios del sellado y de los decants, características y productos relacionados.
- **Contacto** (`/contacto/`): formulario con verificación antispam (Cloudflare Turnstile), mapa y datos de contacto.
- **Gracias** (`/gracias/`) y **404**: no se indexan en buscadores.

---

## 1. Ejecutar el proyecto

Requisitos: **Node.js 22.12 o superior** (`nvm use` lee `.nvmrc`) y
**[gitleaks](https://github.com/gitleaks/gitleaks#installing)**. gitleaks es obligatorio: un hook
bloquea cualquier commit que contenga secretos.

```bash
npm install          # instala dependencias y activa el hook de gitleaks
cp .env.example .env # luego complete los valores (sección 3)
npm run dev          # sitio en http://localhost:4321
npm test             # pruebas de seguridad del formulario
npm run validate     # lint + formato + pruebas + build + revisión de secretos en dist/
```

> `npm run dev` sirve las páginas, pero no la función del formulario. Para probar el envío
> completo en local, use la CLI de Netlify: `npx netlify-cli dev`. Lee el mismo archivo `.env`.

---

## 2. Cambiar los datos del negocio

Todos los datos públicos viven en **un solo archivo: `src/data/site.ts`**.

| Dato                | Dónde                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| Teléfono            | `CONTACT.phone.display` (texto visible) y `CONTACT.phone.e164` (`+503XXXXXXXX`)                         |
| Correo              | `CONTACT.email`                                                                                         |
| Dirección           | `CONTACT.address.street` (si queda vacío, se muestra solo «Santa Tecla, El Salvador»), `city`, `region` |
| Horario             | `OPENING_HOURS` y `CLOSED_DAYS_LABEL`                                                                   |
| Redes sociales      | `SOCIAL_LINKS`                                                                                          |
| Menú                | `NAV_ITEMS`                                                                                             |
| Tiempo de respuesta | `SITE.responseTime`                                                                                     |
| Dominio             | `SITE.url` (también `site` en `astro.config.mjs`)                                                       |

---

## 3. Variables de entorno

Los secretos **nunca** van en el código. En local se guardan en `.env` (ignorado por Git); en
producción, en Netlify: **Site configuration → Environment variables**.

| Variable                    | Tipo                | Para qué sirve                                                                                    |
| --------------------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| `PUBLIC_TURNSTILE_SITE_KEY` | Pública             | Llave de sitio de Turnstile. El build falla si falta.                                             |
| `TURNSTILE_SECRET_KEY`      | **Secreta**         | Verifica el token de Turnstile en el servidor.                                                    |
| `RESEND_API_KEY`            | **Secreta**         | Envía los correos de contacto.                                                                    |
| `CONTACT_FROM_EMAIL`        | Servidor            | Remitente, con un dominio verificado en Resend, por ejemplo `LE SCENT <contacto@lescent.com.sv>`. |
| `CONTACT_TO_EMAIL`          | Servidor (opcional) | Quién recibe las solicitudes. Si falta, se usa `CONTACT.email`.                                   |

Reglas:

- Solo las variables con prefijo `PUBLIC_` llegan al navegador. **Nunca** ponga ese prefijo a una llave privada.
- Después de cada build, `npm run check:dist` falla si algún secreto aparece en `dist/`. Netlify lo ejecuta en cada despliegue.

Para desarrollo local puede usar las [llaves de prueba de Cloudflare](https://developers.cloudflare.com/turnstile/troubleshooting/testing/)
que siempre aprueban: la de sitio `1x00000000000000000000AA` y la secreta `1x0000000000000000000000000000000AA`.

---

## 4. Configurar Turnstile y el envío de correos

**Cloudflare Turnstile (antispam):**

1. En [dash.cloudflare.com](https://dash.cloudflare.com), abra **Turnstile → Add widget**.
2. Nombre: `LE SCENT contacto`. En **Hostnames**, agregue su dominio (por ejemplo, `lescent.com.sv`). Modo: **Managed**.
3. Copie la **Site Key** en `PUBLIC_TURNSTILE_SITE_KEY` y la **Secret Key** en `TURNSTILE_SECRET_KEY` (en Netlify).

**Resend (correo):**

1. Cree una cuenta en [resend.com](https://resend.com). El plan gratuito permite 3.000 correos al mes.
2. En **Domains**, agregue su dominio y cree en su DNS los registros SPF y DKIM que Resend indica.
   Sin un dominio verificado, Resend solo entrega correos a la dirección dueña de la cuenta.
3. En **API Keys**, cree una llave con permiso **Sending access** y cópiela en `RESEND_API_KEY`.
4. Defina `CONTACT_FROM_EMAIL` con una dirección de ese dominio.

**Cómo funciona el formulario:** el navegador valida los campos (solo por comodidad) y los envía en
JSON a `/api/contacto/`. Allí el servidor:

- valida todo de nuevo con Zod y rechaza cualquier campo inesperado;
- verifica Turnstile y el tiempo mínimo de 3 segundos;
- descarta en silencio los envíos que llenan el honeypot;
- limita a 5 envíos por IP cada 15 minutos;
- toma el nombre del producto del catálogo, no del formulario;
- envía el correo con todo el contenido escapado.

Al responder un correo, la respuesta va directamente al cliente (_reply-to_).

---

## 5. Agregar un producto nuevo

1. Copie las imágenes (JPG o PNG, idealmente de 993 × 1404 px o mayores) a `src/assets/productos/`, con nombres en minúsculas y guiones.
2. Duplique un archivo de `src/content/productos/` y renómbrelo con el `slug`, por ejemplo `dior-sauvage-100-ml.md`.
3. Edite el encabezado:

   ```yaml
   ---
   id: LS-021 # único, formato LS-###
   slug: dior-sauvage-100-ml # único: minúsculas, números y guiones; será la URL
   nombre: 'Dior Sauvage Eau de Parfum'
   marca: 'Dior'
   categoria: disenador # disenador | arabes | sets-corporativos
   precio: 135 # USD; null = «Precio a consultar»
   precioAnterior: 150 # opcional: insignia «Oferta» (debe ser mayor que precio)
   contenidoMl: 100 # opcional
   decants: # opcional
     - { ml: 3, precio: 6 }
     - { ml: 5, precio: 10 }
     - { ml: 10, precio: 16 }
   descripcion: 'Texto corto de 40 a 200 caracteres para tarjetas y buscadores.'
   imagenes: # mínimo 1; la primera es la portada
     - src: ../../assets/productos/dior-sauvage.jpg
       alt: 'Frasco de Dior Sauvage Eau de Parfum de 100 ml sobre fondo negro'
   disponible: true # false = «Agotado»
   destacado: false # true = aparece en el inicio (máximo 4)
   fechaPublicacion: 2026-10-15 # durante 30 días muestra «Nuevo»
   caracteristicas: # opcional, «Etiqueta: valor»
     - 'Concentración: Eau de Parfum'
   etiquetas: [masculino, fresco] # opcional, mejoran la búsqueda
   sku: 'LS-DIOR-SAUVAGE' # opcional
   ---
   ```

4. Escriba la descripción larga debajo del segundo `---`.
5. Ejecute `npm run build`. **Si un dato no cumple el esquema, el build falla e indica el archivo y el campo.**

El producto aparece automáticamente en el catálogo, el sitemap, el selector del formulario y el
índice que usa el servidor para validar las solicitudes.

---

## 6. Publicar en Netlify

1. Suba el repositorio a GitHub.
2. En [app.netlify.com](https://app.netlify.com), elija **Add new site → Import an existing project**.
   `netlify.toml` configura todo: `npm ci`, build, revisión de secretos, carpeta `dist`, Node 22, la función y los headers de seguridad.
3. Cargue las variables de entorno (sección 3) **antes** del primer despliegue; sin `PUBLIC_TURNSTILE_SITE_KEY`, el build falla a propósito.
4. Configure su dominio en **Domain management**. Netlify emite el certificado HTTPS y redirige HTTP con 301.
5. Complete la lista de verificación de [`SECURITY.md`](SECURITY.md).

Cada _push_ también ejecuta el workflow de GitHub Actions: auditoría de dependencias, gitleaks,
lint, pruebas y build.

> **¿Vercel?** El sitio está preparado para Netlify. Para usar Vercel habría que mover la función a
> `api/contacto.ts` (formato de Vercel) y reemplazar Netlify Blobs por un almacén externo para el
> límite de envíos (por ejemplo, Upstash Redis). Además, los headers de `netlify.toml` tendrían que
> pasar a `vercel.json`.

---

## 7. Qué debe reemplazar o configurar

- **Variables y llaves:** las de la sección 3, en Netlify.
- **Dirección exacta:** `CONTACT.address.street` en `src/data/site.ts`.
- **Redes sociales:** Instagram `@lescent.sv` aparece en sus fichas. Confirme Facebook y TikTok o elimínelos de `SOCIAL_LINKS`.
- **Dominio:** `https://lescent.com.sv`, en `src/data/site.ts` y `astro.config.mjs`.
- **Productos:**
  - Los precios están transcritos de sus fichas. Revise Odyssey Aqua ($145.00 sellado) y Vintage Radio (a consultar).
  - Born in Roma figura como agotado.
  - Las notas olfativas son de referencia.
- **Sets corporativos:** el contenido, los precios y las imágenes de referencia son una propuesta.
- **Fotos:** los recortes `*-frasco.jpg` y `*-precios.jpg` salen de sus fichas; puede reemplazarlos por fotografías reales.
- **Preguntas frecuentes y beneficios** (`src/data/home.ts`): confirme las políticas de entrega y personalización.

---

## Estructura

```
src/
├── assets/            imágenes (productos y textura de marca)
├── components/        layout, ui, home, catalogo, contacto
├── content/productos/ un .md por producto (esquema en content.config.ts)
├── data/              site.ts (datos del negocio), categorías, contenido del inicio
├── lib/schemas/       contrato del formulario (Zod), compartido por cliente y servidor
├── lib/server/        código exclusivo del servidor (nunca llega al navegador)
├── layouts/ pages/ scripts/ styles/ utils/
netlify/functions/     contacto.ts → /api/contacto/
tests/                 pruebas de seguridad (Vitest)
scripts/               check-dist-secrets.mjs
```
