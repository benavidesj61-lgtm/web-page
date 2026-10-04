# LE SCENT: sitio web y catálogo

Sitio corporativo con catálogo de perfumes y decants originales para **LE SCENT** (El Salvador).
Está construido con Astro, TypeScript y Tailwind CSS. Genera páginas estáticas muy rápidas y lleva a
cada visitante a consultar por WhatsApp.

- **Inicio:** propuesta de valor, categorías, productos destacados, beneficios, testimonios, preguntas frecuentes.
- **Catálogo** (`/catalogo/`): filtros por categoría, búsqueda, orden y enlaces que se pueden compartir.
- **Detalle de producto** (`/catalogo/nombre-del-producto/`): galería con vista ampliada y botón de WhatsApp con mensaje prellenado.
- **Contacto:** formulario validado que abre WhatsApp con los datos, mapa, horarios y redes.
- SEO completo (Open Graph, datos estructurados, sitemap) y accesibilidad WCAG 2.2 AA.

---

## 1. Requisitos

- [Node.js](https://nodejs.org/) **22.12 o superior** (recomendado: la versión 22 LTS).
- npm (se instala junto con Node.js).

## 2. Cómo ejecutar el proyecto

```bash
npm install        # instala las dependencias (solo la primera vez)
npm run dev        # abre el sitio en http://localhost:4321 con recarga automática
```

| Comando            | Qué hace                                                             |
| ------------------ | -------------------------------------------------------------------- |
| `npm run dev`      | Servidor de desarrollo en `http://localhost:4321`.                   |
| `npm run build`    | Revisa tipos y datos, y genera el sitio final en la carpeta `dist/`. |
| `npm run preview`  | Muestra localmente el sitio ya generado (después de `build`).        |
| `npm run lint`     | Revisa la calidad del código con ESLint.                             |
| `npm run format`   | Ordena el formato del código con Prettier.                           |
| `npm run validate` | Ejecuta lint, formato y build. Úselo antes de publicar cambios.      |

> La primera compilación tarda alrededor de un minuto porque optimiza todas las imágenes (AVIF, WebP y
> JPG en varios tamaños). Las siguientes son mucho más rápidas gracias a la caché.

## 3. Dónde se edita cada cosa

| Quiero cambiar…                                    | Archivo                                                       |
| -------------------------------------------------- | ------------------------------------------------------------- |
| WhatsApp, correo, dirección, horarios, redes, menú | `src/config/site.ts`                                          |
| Dominio del sitio                                  | `src/config/site.ts` **y** `astro.config.mjs` (`SITE_URL`)    |
| Productos                                          | `src/content/productos/*.md`                                  |
| Fotos de productos                                 | `src/assets/productos/`                                       |
| Foto principal y fotos de categorías               | `src/assets/marca/`                                           |
| Nombres y descripciones de categorías              | `src/data/categories.ts`                                      |
| Beneficios, testimonios y preguntas frecuentes     | `src/data/home.ts`                                            |
| Textos del inicio (hero, llamada final)            | `src/components/home/*.astro`                                 |
| Colores, tipografía, espaciados                    | `src/styles/global.css` (bloque `@theme`)                     |
| Imagen para redes sociales y favicons              | `public/og-default.jpg`, `public/favicon.svg`, `public/*.png` |

## 4. Cómo agregar un producto nuevo (paso a paso)

1. **Prepare las fotos.** Use imágenes JPG o PNG verticales en proporción **4:5** (por ejemplo,
   1600 × 2000 px), de al menos 1200 px de ancho. Si la proporción es otra, el sitio las recorta al centro.
2. **Copie las fotos** en `src/assets/productos/`, con nombres en minúsculas y sin espacios, por ejemplo
   `versace-eros-1.jpg`, `versace-eros-2.jpg`.
3. **Cree el archivo del producto.** La forma más fácil es duplicar uno existente de
   `src/content/productos/` y renombrarlo, por ejemplo `versace-eros-eau-de-toilette-100-ml.md`.
4. **Edite los datos** entre las líneas `---`:

   ```markdown
   ---
   id: LS-009 # Código interno único (formato LS-001)
   slug: versace-eros-eau-de-toilette-100-ml # Dirección web: solo minúsculas, números y guiones
   nombre: Versace Eros Eau de Toilette 100 ml
   marca: Versace # Opcional
   categoria: perfumes # perfumes | decants | sets-corporativos
   precio: 95 # En USD, sin el símbolo $
   precioAnterior: 110 # Opcional. Si existe, se muestra la insignia "Oferta"
   descripcion: Menta, manzana verde y vainilla en una fragancia intensa y seductora para la noche. # 40 a 200 caracteres
   imagenes:
     - src: ../../assets/productos/versace-eros-1.jpg
       alt: Frasco azul turquesa de Versace Eros Eau de Toilette de 100 ml sobre fondo claro
     - src: ../../assets/productos/versace-eros-2.jpg
       alt: Caja original sellada de Versace Eros junto al frasco
   disponible: true # false muestra "Agotado"
   destacado: false # true lo muestra en el inicio (máximo 4)
   fechaPublicacion: 2026-10-15 # Los primeros 30 días se muestra "Nuevo"
   caracteristicas: # Opcional
     - 'Concentración: Eau de Toilette'
     - 'Contenido: 100 ml'
   etiquetas: [caballero, noche] # Opcional, ayudan en la búsqueda
   sku: VER-ERO-EDT-100 # Opcional
   ---

   Aquí va la descripción larga que aparece en la página del producto. Puede usar **negritas**
   y varios párrafos.
   ```

5. **Revise el resultado** con `npm run dev` y abra `http://localhost:4321/catalogo/`.
6. **Publique** con `npm run build`. Si algún dato no cumple las reglas, la compilación se detiene y
   muestra un mensaje que indica el archivo y el campo exacto. Por ejemplo:
   `categoria: La "categoria" debe ser una de: perfumes, decants, sets-corporativos.`

**Reglas que se validan automáticamente:** todos los campos obligatorios presentes, `id` y `slug` únicos,
al menos una imagen con texto alternativo descriptivo (mínimo 15 caracteres), precio mayor que 0 y
`precioAnterior` mayor que `precio`.

Para **quitar** un producto, borre su archivo `.md` y sus fotos. Para **marcarlo como agotado** sin
quitarlo, cambie `disponible: false`.

## 5. Cómo publicar el sitio

Antes de publicar, actualice el dominio real en `src/config/site.ts` (`url`) y en `astro.config.mjs`
(`SITE_URL`). Así los enlaces canónicos, el sitemap y las vistas previas en redes apuntan al lugar correcto.

### Opción A: Netlify

1. Suba el proyecto a un repositorio de GitHub.
2. En [app.netlify.com](https://app.netlify.com), elija **Add new site → Import an existing project** y
   seleccione el repositorio.
3. Netlify lee `netlify.toml` y configura todo solo: comando `npm run build`, carpeta `dist` y Node 22.
4. Presione **Deploy**. En **Domain management** puede conectar su dominio (por ejemplo `lescent.com.sv`).

### Opción B: Vercel

1. Suba el proyecto a un repositorio de GitHub.
2. En [vercel.com/new](https://vercel.com/new), importe el repositorio. Vercel detecta Astro y lee
   `vercel.json` (comando `npm run build`, carpeta `dist`).
3. Presione **Deploy** y luego agregue su dominio en **Settings → Domains**.

En ambos casos, cada cambio que suba a la rama principal publica una nueva versión automáticamente.

## 6. Decisiones técnicas importantes

- **WhatsApp como canal de conversión:** todos los botones abren WhatsApp con un mensaje prellenado.
  En la ficha de producto el mensaje incluye el nombre, el precio y el enlace del producto. Si conecta un
  asistente de IA a su WhatsApp Business, recibirá estas consultas ya identificadas.
- **Formulario de contacto sin servidor:** al enviarlo se valida y se abre WhatsApp con los datos.
  Funciona en cualquier hosting y no requiere configuración adicional.
- **Mapa con carga a petición:** Google Maps solo se carga cuando el visitante presiona "Cargar mapa
  interactivo". Así la página es más rápida y no instala cookies de terceros sin permiso.
- **Filtros del catálogo en la URL:** por ejemplo, `/catalogo/?categoria=decants&orden=precio-asc`
  se puede compartir. Sin JavaScript se muestra el catálogo completo.
- **Paginación:** a partir de 12 productos aparece el botón "Cargar más productos".

## 7. Lista de contenido por reemplazar

- [ ] **Fotos de productos** en `src/assets/productos/`. Las actuales son ilustraciones de referencia.
- [ ] **Foto principal** (`src/assets/marca/hero.jpg`) y **fotos de categorías** (`categoria-*.jpg`).
- [ ] **Imagen para redes sociales** `public/og-default.jpg` (1200 × 630 px).
- [ ] **Favicons** en `public/` (`favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`).
- [ ] **Productos de ejemplo:** precios, descripciones, características y fechas reales.
- [ ] **Correo** (`ventas@lescent.com.sv`), **dirección**, **coordenadas** y **texto del mapa** en `src/config/site.ts`.
- [ ] **Horarios de atención** y **redes sociales** (Instagram, Facebook y TikTok) en `src/config/site.ts`.
- [ ] **Dominio** en `src/config/site.ts` y `astro.config.mjs`.
- [ ] **Testimonios:** reemplácelos por opiniones reales de clientes, con su autorización, en `src/data/home.ts`.
- [ ] **Preguntas frecuentes:** confirme formas de pago, tiempos y cobertura de envío en `src/data/home.ts`.
- [ ] **Beneficios:** confirme tiempos de entrega y mínimos corporativos en `src/data/home.ts`.
- [ ] El número de WhatsApp (+503 7529-2926) ya está configurado. Si cambia, edítelo en `src/config/site.ts`.
