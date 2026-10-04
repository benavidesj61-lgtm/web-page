# LE SCENT · Sitio web y catálogo

Sitio corporativo y catálogo de **LE SCENT**, perfumes y decants originales en El Salvador.
Está construido con Astro (sitio estático), TypeScript, Tailwind CSS y Netlify Forms, y obtiene
95 o más en Lighthouse en Rendimiento, Accesibilidad, Buenas Prácticas y SEO.

- **Inicio**: hero, colecciones, productos destacados, beneficios, testimonios, preguntas frecuentes y llamada a la acción.
- **Catálogo** (`/catalogo/`): filtros por categoría, búsqueda, ordenamiento y botón «Cargar más». Los filtros se guardan en la URL, así que puede compartir un resultado.
- **Detalle de producto** (`/catalogo/<slug>/`): galería con vista ampliada, precios del frasco sellado y de los decants, características y productos relacionados.
- **Contacto** (`/contacto/`): formulario con validación accesible, protección anti-spam, mapa y datos de contacto.
- **Gracias** (`/gracias/`) y **404**: no se indexan en buscadores.

---

## 1. Ejecutar el proyecto

Requisitos: **Node.js 22.12 o superior** (puede usar `nvm use`, porque el proyecto incluye `.nvmrc`).

```bash
npm install          # instala las dependencias (solo la primera vez)
npm run dev          # abre el sitio en http://localhost:4321
npm run build        # verifica tipos y datos, y genera el sitio en dist/
npm run preview      # sirve dist/ para revisar el resultado final
npm run validate     # lint + formato + build: ejecútelo antes de publicar
```

> En local, el formulario muestra el estado de error al enviar, porque Netlify Forms solo existe una
> vez publicado en Netlify. Es el comportamiento esperado.

---

## 2. Cambiar los datos del negocio

Todos los datos de contacto viven en **un solo archivo: `src/data/site.ts`**. Allí se editan:

| Dato                | Dónde                                                                                   |
| ------------------- | --------------------------------------------------------------------------------------- |
| Teléfono            | `CONTACT.phone.display` (texto visible) y `CONTACT.phone.e164` (formato `+503XXXXXXXX`) |
| Correo              | `CONTACT.email`                                                                         |
| Dirección           | `CONTACT.address.street` (si queda vacío, solo se muestra la ciudad), `city` y `region` |
| Horario             | `OPENING_HOURS` y `CLOSED_DAYS_LABEL`                                                   |
| Redes sociales      | `SOCIAL_LINKS`                                                                          |
| Menú                | `NAV_ITEMS`                                                                             |
| Tiempo de respuesta | `SITE.responseTime`                                                                     |
| Dominio             | `SITE.url` (también en `site` dentro de `astro.config.mjs`)                             |

El pie de página, la página de contacto, el mapa, los enlaces `tel:` y `mailto:` y los datos
estructurados para Google se actualizan solos a partir de este archivo.

---

## 3. Agregar un producto nuevo, paso a paso

1. **Prepare las imágenes.** Use JPG o PNG en orientación vertical, idealmente de 993 × 1404 px
   (proporción 5:7, como sus fichas actuales) o mayores. No hace falta optimizarlas: Astro genera
   automáticamente las versiones AVIF y WebP en varios tamaños.
2. **Copie las imágenes** a `src/assets/productos/`, con nombres en minúsculas y guiones, por ejemplo
   `dior-sauvage.jpg`.
3. **Duplique un producto existente** de `src/content/productos/` (por ejemplo,
   `lattafa-yara-100-ml.md`) y renómbrelo con el mismo texto que usará como `slug`, por ejemplo
   `dior-sauvage-100-ml.md`.
4. **Edite el encabezado** (la parte entre `---`):

   ```yaml
   ---
   id: LS-021 # único, formato LS-###
   slug: dior-sauvage-100-ml # único: minúsculas, números y guiones; será la URL
   nombre: 'Dior Sauvage Eau de Parfum'
   marca: 'Dior'
   categoria: disenador # disenador | arabes | sets-corporativos
   precio: 135 # frasco sellado en USD; use null para «Precio a consultar»
   precioAnterior: 150 # opcional: muestra la insignia «Oferta» (debe ser mayor que precio)
   contenidoMl: 100 # opcional: tamaño del frasco
   decants: # opcional: precios por tamaño de decant
     - { ml: 3, precio: 6 }
     - { ml: 5, precio: 10 }
     - { ml: 10, precio: 16 }
   descripcion: 'Texto corto de 40 a 200 caracteres para tarjetas y buscadores.'
   imagenes: # mínimo 1; la primera es la portada
     - src: ../../assets/productos/dior-sauvage.jpg
       alt: 'Frasco de Dior Sauvage Eau de Parfum de 100 ml sobre fondo negro'
   disponible: true # false muestra «Agotado»
   destacado: false # true lo muestra en el inicio (máximo 4)
   fechaPublicacion: 2026-10-15 # durante 30 días muestra la insignia «Nuevo»
   caracteristicas: # opcional: «Etiqueta: valor»
     - 'Concentración: Eau de Parfum'
     - 'Familia olfativa: aromática fougère'
   etiquetas: [masculino, fresco] # opcional: mejoran la búsqueda
   sku: 'LS-DIOR-SAUVAGE' # opcional
   ---
   ```

5. **Escriba la descripción larga** debajo del segundo `---` (en Markdown; puede usar **negritas**).
6. Ejecute `npm run build`. **Si falta un dato o tiene un formato incorrecto, el build falla y le
   indica el archivo y el campo exactos** (por ejemplo: `El "slug" solo admite minúsculas…`). También
   falla si un `id` o un `slug` se repite.

El producto aparecerá automáticamente en el catálogo, en su categoría, en el selector del formulario
de contacto, en el sitemap y con sus datos estructurados de Google.

**Para eliminar un producto**, borre su archivo `.md` (y sus imágenes, si ya no se usan).

> La insignia «Nuevo» se calcula al publicar el sitio. Si un producto debe dejar de mostrarse como
> nuevo, basta con volver a publicar (Netlify y Vercel lo hacen con cada cambio).

---

## 4. Configurar el envío del formulario (Netlify Forms)

El formulario ya está preparado para **Netlify Forms**: no necesita cuentas adicionales ni claves.

1. Publique el sitio en Netlify (siguiente sección). Durante la publicación, Netlify detecta el formulario
   `contacto` automáticamente.
2. En el panel de Netlify, abra **Site configuration → Forms** y confirme que el formulario
   `contacto` aparece en la lista. Si la detección está desactivada, actívela con **Enable form detection**
   y vuelva a publicar.
3. En **Forms → Form notifications → Add notification → Email notification**, escriba el correo que
   recibirá las solicitudes (por ejemplo, `lescetsv@gmail.com`).
4. Haga una prueba real desde `/contacto/`: al enviar, debe llegar a `/gracias/` y el mensaje debe
   aparecer en **Forms → contacto**.

**Cómo funciona:**

- Con JavaScript, el formulario se envía en segundo plano. El botón se desactiva y muestra «Enviando…»;
  si el envío falla, aparece un aviso con el teléfono y el correo como alternativa. Al enviarse con éxito,
  redirige a `/gracias/`.
- Sin JavaScript, el navegador envía el formulario de forma nativa y Netlify redirige a `/gracias/`.
- **Anti-spam:** un campo oculto (honeypot, `sitio-web`) descarta los envíos de bots. Netlify además
  filtra el spam con Akismet. Si necesita más protección, puede activar reCAPTCHA en el panel de Netlify.
- El producto de interés llega con su nombre e id (por ejemplo, `Lattafa Yara (LS-011)`). Los enlaces
  `/contacto/?producto=<slug>` precargan el producto en el selector.

> **¿Publicará en Vercel u otro hosting?** Netlify Forms solo funciona en Netlify. En ese caso, cree
> un formulario gratuito en [Formspree](https://formspree.io) y cambie en
> `src/scripts/contact-form.ts` la URL del `fetch('/', …)` por la de Formspree
> (`https://formspree.io/f/<su-id>`), con la cabecera `Accept: application/json`. En
> `ContactForm.astro`, cambie también el `action` del formulario por esa misma URL.

---

## 5. Publicar el sitio

### Netlify (recomendado, por el formulario)

1. Suba el proyecto a un repositorio de GitHub, GitLab o Bitbucket.
2. En [app.netlify.com](https://app.netlify.com), elija **Add new site → Import an existing project** y
   seleccione el repositorio.
3. Netlify lee `netlify.toml` y configura todo solo: comando `npm run build`, carpeta `dist` y Node 22.
4. Cuando termine la publicación, configure su dominio en **Domain management** y actualice
   `SITE.url` (en `src/data/site.ts`) y `site` (en `astro.config.mjs`) con ese dominio.
5. Configure las notificaciones del formulario (sección 4).

Cada cambio que suba al repositorio se publica automáticamente.

### Vercel

1. En [vercel.com/new](https://vercel.com/new), importe el repositorio. Vercel detecta Astro y lee `vercel.json`.
2. Publique y configure el dominio en **Settings → Domains**.
3. Configure Formspree para el formulario (nota de la sección 4).

---

## 6. Lo que debe reemplazar o revisar antes de publicar

- **Dirección:** `CONTACT.address.street` en `src/data/site.ts` está vacía; el sitio muestra solo «San Salvador, El Salvador» hasta que la complete.
- **Correo:** se usa `lescetsv@gmail.com` tal como se indicó. Verifique que la ortografía sea la correcta.
- **Redes sociales:** Instagram `@lescent.sv` aparece en las fichas. Confirme las direcciones de Facebook y TikTok o elimínelas de `SOCIAL_LINKS`.
- **Dominio:** `https://lescent.com.sv` en `src/data/site.ts` y `astro.config.mjs`.
- **Testimonios:** los de `src/data/home.ts` son textos de ejemplo. Reemplácelos por testimonios reales, con autorización de cada cliente.
- **Productos:** precios y presentaciones transcritos de las fichas. Revise en especial:
  - **Armaf Odyssey Aqua:** la ficha indica $145.00 por el frasco sellado.
  - **Lattafa Vintage Radio:** el precio del sellado es «a consultar».
  - **Valentino Uomo Born in Roma:** está marcado como agotado (`disponible: false`) para mostrar la insignia.
  - Las notas olfativas y descripciones son de referencia.
- **Sets corporativos:** el contenido, los precios y las imágenes de los dos sets (`set-discovery-*.md`) son una propuesta. Las imágenes dicen «Imagen de referencia»; reemplácelas por fotos reales.
- **Fotos:** las imágenes de detalle (`*-frasco.jpg` y `*-precios.jpg`) son recortes de cada ficha. Puede sustituirlas por fotografías reales del producto.
- **Preguntas frecuentes y beneficios** (`src/data/home.ts`): confirme que las políticas de entrega y personalización coinciden con su operación.

---

## Estructura

```
src/
├── assets/            imágenes originales (productos y textura de marca)
├── components/        layout, ui, home, catalogo, contacto
├── content/productos/ un archivo .md por producto
├── content.config.ts  esquema Zod de productos (el build falla si un producto no lo cumple)
├── data/              site.ts (datos del negocio), categorías, contenido del inicio
├── layouts/           BaseLayout.astro (SEO, fuentes, header, footer)
├── pages/             inicio, catálogo, detalle, contacto, gracias, 404, robots.txt
├── scripts/           JavaScript mínimo: menú, filtros, galería, formulario, animaciones
├── styles/global.css  tokens del sistema de diseño (colores, tipografía, espaciado)
└── utils/             precios, enlaces de contacto, JSON-LD, productos
```
