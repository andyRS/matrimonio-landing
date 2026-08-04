# Restaura Tu Matrimonio — Landing page

Sitio estático (HTML/CSS/JS puro, sin build step) para **restauratumatrimonio.org**, la landing de ventas del curso *"Cómo Recuperar y Fortalecer tu Matrimonio"* del Pastor Andres Arango. El producto se vende a través de Hotmart (este sitio es un afiliado autorizado); el checkout, upsells y página de agradecimiento son propiedad de Hotmart, no de este repositorio.

## Estructura

```
index.html       # Página principal (todo el markup, estilos y scripts de la página)
analytics.js      # Wrapper de tracking: Meta Pixel + GA4, config-driven, no falla si faltan IDs
contacto.html, privacidad.html, terminos.html
CNAME             # Dominio custom para GitHub Pages
sitemap.xml, robots.txt
```

## Imágenes (Cloudflare R2)

Las imágenes del sitio (mockup del curso, ebooks/bonos, fotos del autor, banner de autoridad) se sirven desde Cloudflare R2, no desde Google Drive (Drive puede cortar el hotlinking sin aviso).

- **Bucket**: `landingassets` (cuenta Cloudflare, prefijo `r2-upload/`)
- **Acceso público**: Public Development URL — `https://pub-6b628a581f5c4279a17754da05badef4.r2.dev`
- Para subir una imagen nueva: R2 dashboard → bucket `landingassets` → carpeta `r2-upload/` → Upload, y referenciarla en `index.html` como `https://pub-6b628a581f5c4279a17754da05badef4.r2.dev/r2-upload/nombre-archivo.ext`

Nota: la Public Development URL no tiene SLA garantizado por Cloudflare para producción a largo plazo. Si más adelante el DNS de `restauratumatrimonio.org` se mueve a Cloudflare, se recomienda migrar a un dominio custom (ej. `img.restauratumatrimonio.org`) vía R2 → Settings → Custom Domains, para mayor confiabilidad.

## Cómo configurar Meta Pixel / GA4

Toda la configuración de tracking vive en un solo bloque, al inicio del `<head>` de `index.html`:

```html
<script>
  window.RTM_CONFIG = {
    META_PIXEL_ID: '1792476815276272',
    GA4_MEASUREMENT_ID: ''         // Ej: 'G-XXXXXXXXXX'
  };
</script>
```

- **Meta Pixel**: ya está configurado con el Pixel ID `1792476815276272` (Meta Events Manager → conjunto de datos "Restaura tu matrimonio"). Si necesitas cambiarlo, edita `META_PIXEL_ID`. Si lo dejas vacío, el Pixel simplemente no se carga — no rompe nada.
  - El Pixel también tiene configurada la **API de Conversiones** del lado de Hotmart (Hotmart → Configuración de Píxel → token de acceso generado en Meta Events Manager), para que `Ventas realizadas` y `Visitas en la Página de Pago` lleguen directo desde el servidor, sin depender de cookies del navegador.
- **GA4**: pega tu Measurement ID (`G-XXXXXXXXXX`, de Google Analytics → Administrador → Flujos de datos) en `GA4_MEASUREMENT_ID`. Mientras esté vacío, GA4 no se activa.
- El `<noscript>` de fallback del Pixel (para usuarios sin JavaScript) tiene el ID hardcodeado por separado — si cambias `META_PIXEL_ID`, actualiza también ese `<img src="...facebook.com/tr?id=...">` justo debajo.

### Eventos que se trackean automáticamente (`analytics.js`)

| Evento          | Cuándo se dispara                                    | Meta Pixel          | GA4               |
|-----------------|-------------------------------------------------------|----------------------|-------------------|
| PageView        | Al cargar la página                                   | `PageView`           | automático (config)|
| ViewContent     | Al cargar la página (vista del curso)                 | `ViewContent`        | `view_item`       |
| CtaClick        | Clic en cualquier CTA hacia Hotmart                   | `trackCustom`        | `select_content`  |
| InitiateCheckout| Justo antes de salir hacia el checkout de Hotmart     | `InitiateCheckout`   | `begin_checkout`  |

El *Purchase* real NO se trackea desde este sitio — lo dispara Hotmart directamente a Meta vía API de Conversiones (Hotmart es quien sabe si la venta se completó).

## Cómo publicar en GitHub Pages

Este repo ya está configurado para GitHub Pages con dominio custom (ver `CNAME` → `restauratumatrimonio.org`).

1. Haz commit y push a `main`.
2. GitHub Pages sirve automáticamente desde `main` (no hay build step).
3. El sitio se sirve detrás de la CDN de Fastly con `Cache-Control: max-age=600` — los cambios pueden tardar hasta 10 minutos en verse reflejados en el dominio en vivo, aunque el contenido en GitHub ya esté actualizado. Verifica con:
   ```
   curl https://raw.githubusercontent.com/andyRS/matrimonio-landing/main/index.html
   ```
   para confirmar que el cambio ya está en el repo, incluso si el dominio en vivo todavía muestra la versión anterior.

## Limitaciones conocidas

- **Sin cabeceras de seguridad configurables.** GitHub Pages no permite establecer `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options` ni `Permissions-Policy` en las respuestas del dominio custom — no hay forma de configurarlas sin poner un proxy delante (ej. Cloudflare). Si esto se vuelve un requisito (por ejemplo, para cumplir con algún estándar de seguridad de una pasarela de pago o anunciante), la opción es migrar el hosting o poner el dominio detrás de Cloudflare en modo proxy.

## Checklist antes de lanzar campañas de pago

- [ ] `META_PIXEL_ID` configurado y verificado en Meta Events Manager (conjunto de datos con actividad de eventos > 0)
- [ ] Hotmart → Configuración de Píxel: Evento vía Web y Evento vía API ambos en verde ("Configurado" / "Token configurado")
- [ ] `GA4_MEASUREMENT_ID` configurado si vas a correr campañas también en Google Ads
- [ ] Countdown de 48h probado: debe iniciar en la primera visita, persistir en recargas, y **ocultarse por completo** al llegar a cero (nunca reiniciarse ni fingir tiempo restante)
- [ ] Revisar que los 3 CTAs hacia Hotmart tengan sus UTMs (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`) y que el link base (`https://go.hotmart.com/D1064872390`) no haya sido alterado
- [ ] Revisar accesibilidad básica: navegación completa por teclado (Tab), video reproducible con Enter/Espacio, FAQ con `aria-expanded` correcto
- [ ] Confirmar que no queda ningún dato de "reviews" o "rating" no verificable en el schema.org (`aggregateRating` fue removido intencionalmente por no ser verificable)
