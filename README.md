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

## Cómo configurar Meta Pixel / GA4

Toda la configuración de tracking vive en un solo bloque, al inicio del `<head>` de `index.html`:

```html
<script>
  window.RTM_CONFIG = {
    META_PIXEL_ID: '1792476815276272',
    GA4_MEASUREMENT_ID: '',        // Ej: 'G-XXXXXXXXXX'
    LEAD_MAGNET_ENDPOINT: ''       // Ej: 'https://formspree.io/f/xxxxxxx'
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
| Lead            | Envío exitoso del formulario de lead magnet           | `Lead`               | `generate_lead`   |

El *Purchase* real NO se trackea desde este sitio — lo dispara Hotmart directamente a Meta vía API de Conversiones (Hotmart es quien sabe si la venta se completó).

## Cómo configurar el endpoint del lead magnet

La sección "Guía gratis: 7 oraciones para restaurar tu matrimonio" (antes del CTA final) tiene un formulario de nombre + email. Para que envíe datos de verdad, necesitas un servicio de captura de leads compatible con `fetch POST` + JSON:

1. Crea un formulario en **[Formspree](https://formspree.io)**, **Brevo** o **MailerLite** (cualquiera que acepte `POST` con `Content-Type: application/json` y devuelva `2xx` en éxito).
2. Copia la URL del endpoint.
3. Pégala en `LEAD_MAGNET_ENDPOINT` dentro de `RTM_CONFIG` en `index.html`.

Mientras `LEAD_MAGNET_ENDPOINT` esté vacío, el formulario no falla ni rompe la página — muestra un mensaje de "configuración pendiente" y deja constancia en la consola del navegador (`console.info`), para que sea obvio que falta conectar el endpoint.

## Cómo publicar en GitHub Pages

Este repo ya está configurado para GitHub Pages con dominio custom (ver `CNAME` → `restauratumatrimonio.org`).

1. Haz commit y push a `main`.
2. GitHub Pages sirve automáticamente desde `main` (no hay build step).
3. El sitio se sirve detrás de la CDN de Fastly con `Cache-Control: max-age=600` — los cambios pueden tardar hasta 10 minutos en verse reflejados en el dominio en vivo, aunque el contenido en GitHub ya esté actualizado. Verifica con:
   ```
   curl https://raw.githubusercontent.com/andyRS/matrimonio-landing/main/index.html
   ```
   para confirmar que el cambio ya está en el repo, incluso si el dominio en vivo todavía muestra la versión anterior.

## Checklist antes de lanzar campañas de pago

- [ ] `META_PIXEL_ID` configurado y verificado en Meta Events Manager (conjunto de datos con actividad de eventos > 0)
- [ ] Hotmart → Configuración de Píxel: Evento vía Web y Evento vía API ambos en verde ("Configurado" / "Token configurado")
- [ ] `GA4_MEASUREMENT_ID` configurado si vas a correr campañas también en Google Ads
- [ ] `LEAD_MAGNET_ENDPOINT` configurado y probado (envía un lead de prueba y confirma que llega al servicio conectado)
- [ ] Countdown de 48h probado: debe iniciar en la primera visita, persistir en recargas, y **ocultarse por completo** al llegar a cero (nunca reiniciarse ni fingir tiempo restante)
- [ ] Revisar que los 3 CTAs hacia Hotmart tengan sus UTMs (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`) y que el link base (`https://go.hotmart.com/D1064872390`) no haya sido alterado
- [ ] Probar el formulario de lead magnet en escritorio y móvil
- [ ] Revisar accesibilidad básica: navegación completa por teclado (Tab), video reproducible con Enter/Espacio, FAQ con `aria-expanded` correcto
- [ ] Confirmar que no queda ningún dato de "reviews" o "rating" no verificable en el schema.org (`aggregateRating` fue removido intencionalmente por no ser verificable)
