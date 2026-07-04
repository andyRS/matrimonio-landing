/**
 * RTM Analytics — wrapper de tracking para Meta Pixel + GA4.
 *
 * Lee configuración de window.RTM_CONFIG (definido inline en el <head> de index.html).
 * Si falta un ID o endpoint, la función correspondiente simplemente no hace nada —
 * nunca lanza un error ni bloquea la página. Ver README.md para instrucciones de configuración.
 */
(function () {
  var config = window.RTM_CONFIG || {};

  function loadMetaPixel(pixelId) {
    if (!pixelId) return;
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', pixelId);
  }

  function loadGA4(measurementId) {
    if (!measurementId) return;
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', measurementId);
  }

  loadMetaPixel(config.META_PIXEL_ID);
  loadGA4(config.GA4_MEASUREMENT_ID);

  // Eventos estándar de Meta -- todo lo que no esté aquí se envía como trackCustom.
  var META_STANDARD_EVENTS = { PageView: 1, ViewContent: 1, InitiateCheckout: 1, Lead: 1, Purchase: 1 };
  // Mapeo a nombres de evento recomendados por GA4 (null = no aplica / ya cubierto por 'config').
  var GA4_EVENT_MAP = { PageView: null, ViewContent: 'view_item', CtaClick: 'select_content', InitiateCheckout: 'begin_checkout', Lead: 'generate_lead' };

  function track(eventName, params) {
    params = params || {};
    try {
      if (typeof window.fbq === 'function') {
        if (META_STANDARD_EVENTS[eventName]) {
          window.fbq('track', eventName, params);
        } else {
          window.fbq('trackCustom', eventName, params);
        }
      }
    } catch (e) {
      console.warn('[RTM Analytics] Meta Pixel error:', e);
    }
    try {
      if (typeof window.gtag === 'function') {
        var ga4Name = GA4_EVENT_MAP.hasOwnProperty(eventName) ? GA4_EVENT_MAP[eventName] : eventName;
        if (ga4Name) window.gtag('event', ga4Name, params);
      }
    } catch (e) {
      console.warn('[RTM Analytics] GA4 error:', e);
    }
  }

  window.RTMAnalytics = { track: track };

  function initTracking() {
    // PageView + ViewContent al cargar la página de ventas del curso.
    track('PageView');
    track('ViewContent', { content_name: 'Curso Restaura Tu Matrimonio', value: 149, currency: 'USD' });

    // Clics en cualquier CTA hacia Hotmart -> CtaClick (medible por botón) + InitiateCheckout
    // (evento estándar, se dispara justo antes de salir hacia el checkout de Hotmart).
    document.querySelectorAll('a[href*="go.hotmart.com"]').forEach(function (link) {
      link.addEventListener('click', function () {
        var ctaId = link.getAttribute('data-cta-id') || 'unknown_cta';
        track('CtaClick', { content_name: ctaId });
        track('InitiateCheckout', { content_name: 'Curso Restaura Tu Matrimonio', value: 149, currency: 'USD' });
      });
    });

    // Formulario del lead magnet ("Guía gratis: 7 oraciones para restaurar tu matrimonio").
    var form = document.getElementById('leadMagnetForm');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var statusEl = document.getElementById('leadMagnetStatus');
      var endpoint = config.LEAD_MAGNET_ENDPOINT;
      var nameInput = form.querySelector('[name="name"]');
      var emailInput = form.querySelector('[name="email"]');
      var nameVal = nameInput ? nameInput.value : '';
      var emailVal = emailInput ? emailInput.value : '';

      if (!endpoint) {
        console.info('[RTM Analytics] Lead magnet: no hay LEAD_MAGNET_ENDPOINT configurado en RTM_CONFIG. Configura un endpoint (Formspree/Brevo/MailerLite) en index.html para activar el envío real.');
        if (statusEl) {
          statusEl.textContent = 'Configuración pendiente: aún no hay un servicio conectado para recibir la guía. Escríbenos y te la enviamos manualmente.';
          statusEl.className = 'lead-status lead-status--pending';
        }
        return;
      }

      if (statusEl) {
        statusEl.textContent = 'Enviando...';
        statusEl.className = 'lead-status';
      }

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameVal,
          email: emailVal,
          source: 'lead_magnet_7_oraciones',
          _subject: 'Nueva descarga de la guía "7 oraciones" — ' + nameVal,
          _replyto: emailVal
        })
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Request failed with status ' + res.status);
          track('Lead', { content_name: 'Guia 7 oraciones' });
          if (statusEl) {
            statusEl.textContent = '¡Listo! Revisa tu correo — te enviamos la guía.';
            statusEl.className = 'lead-status lead-status--success';
          }
          form.reset();
        })
        .catch(function () {
          if (statusEl) {
            statusEl.textContent = 'Hubo un problema enviando tus datos. Intenta de nuevo en unos minutos.';
            statusEl.className = 'lead-status lead-status--error';
          }
        });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTracking);
  } else {
    initTracking();
  }
})();
