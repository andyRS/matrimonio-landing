# Restaura Tu Matrimonio — Landing page

Sitio estático (HTML/CSS/JS puro, sin build step) para **restauratumatrimonio.org**, la landing de ventas del curso *"Cómo Recuperar y Fortalecer tu Matrimonio"* del Pastor Andres Arango. El producto se vende a través de Hotmart (este sitio es un afiliado autorizado); el checkout, upsells y página de agradecimiento son propiedad de Hotmart, no de este repositorio.

## Estructura

```
index.html       # Contenido y estructura de la página principal
styles.css       # Estilos de la landing adaptable a móvil
landing.js       # Reproducción de video bajo demanda y CTA móvil
analytics.js     # Wrapper de tracking: Meta Pixel + GA4
assets/          # Fotografía ilustrativa de portada y símbolo de unión
contacto.html, privacidad.html, terminos.html
CNAME             # Dominio custom para GitHub Pages
sitemap.xml, robots.txt
```

## Imágenes

`assets/hero-couple.webp` es una imagen ilustrativa generada para esta portada; representa una conversación de pareja y no a participantes ni testimonios del programa. `assets/union-mark.svg` es el símbolo de dos aros usado en el encabezado y pie de página. Ambos se sirven desde este repositorio.

Las imágenes del producto y del instructor (mockup del curso, ebooks/bonos, fotos del autor, banner de autoridad) se sirven desde Cloudflare R2, no desde Google Drive (Drive puede cortar el hotlinking sin aviso).

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
    META_PIXEL_ID_2: '1639376823820584',
    GA4_MEASUREMENT_ID: 'G-TPS7XFZXM7'
  };
</script>
```

- **Meta Pixel**: ya está configurado con el Pixel ID `1792476815276272` (Meta Events Manager → conjunto de datos "Restaura tu matrimonio"). Si necesitas cambiarlo, edita `META_PIXEL_ID`. Si lo dejas vacío, el Pixel simplemente no se carga — no rompe nada.
  - El Pixel también tiene configurada la **API de Conversiones** del lado de Hotmart (Hotmart → Configuración de Píxel → token de acceso generado en Meta Events Manager), para que `Ventas realizadas` y `Visitas en la Página de Pago` lleguen directo desde el servidor, sin depender de cookies del navegador.
- **GA4**: el Measurement ID actual está en `GA4_MEASUREMENT_ID`. Si se deja vacío, GA4 no se activa.

### Eventos que se trackean automáticamente (`analytics.js`)

| Evento          | Cuándo se dispara                                    | Meta Pixel          | GA4               |
|-----------------|-------------------------------------------------------|----------------------|-------------------|
| PageView        | Al cargar la página                                   | `PageView`           | automático (config)|
| ViewContent     | Al cargar la página (vista del curso)                 | `ViewContent`        | `view_item`       |
| CtaClick        | Clic en un enlace hacia la página del productor       | `trackCustom`        | `select_content`  |

El enlace `go.hotmart.com/D1064872390` redirige primero a la **carta de ventas del productor**, no al checkout. Por eso esta landing no dispara `InitiateCheckout`. La plataforma externa debe registrar el inicio real de compra y la venta. Esta landing tampoco dispara *Purchase*.

Cuando la visita llega con `utm_source` y `utm_term` (o `utm_content`) válidos, `landing.js` agrega esa procedencia como `utm_term` al enlace saliente. Así se conserva el origen del artículo sin sobrescribir el identificador del CTA (`utm_content`).

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
- [ ] Confirmar en la carta de ventas del productor el precio, los cuatro bonos y las condiciones de reembolso. El 19/10/2026 mostraba **US$97** como precio especial y siete días de garantía; si cambia, actualizar `index.html`.
- [ ] Revisar que los CTAs hacia Hotmart tengan sus UTMs (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`) y que el enlace base (`https://go.hotmart.com/D1064872390`) no haya sido alterado.
- [ ] Revisar accesibilidad básica: navegación completa por teclado (Tab), video reproducible con Enter/Espacio, FAQ con `aria-expanded` correcto
- [ ] Confirmar que los cinco videos de YouTube (presentación y cuatro testimonios) siguen disponibles y pertenecen al programa.
- [ ] No publicar cifras de resultados, credenciales verificadas, descuentos comparativos o urgencia sin respaldo actualizado.
