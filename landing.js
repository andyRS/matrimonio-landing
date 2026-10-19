(function () {
  // Conservar el origen del blog para atribuir ventas sin perder el CTA de esta página.
  var incoming = new URLSearchParams(window.location.search);
  var source = incoming.get('utm_source') || '';
  var article = incoming.get('utm_term') || incoming.get('utm_content') || '';
  if (/^[a-z0-9_-]{1,40}$/i.test(source) && /^[a-z0-9_-]{1,80}$/i.test(article)) {
    document.querySelectorAll('a[href*="go.hotmart.com/D1064872390"]').forEach(function (link) {
      var destination = new URL(link.href);
      destination.searchParams.set('utm_term', source + '_' + article);
      link.href = destination.toString();
    });
  }

  var videoButton = document.querySelector('[data-video-id]');
  if (videoButton) {
    videoButton.addEventListener('click', function () {
      var videoId = videoButton.getAttribute('data-video-id');
      if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId || '')) return;
      var iframe = document.createElement('iframe');
      iframe.className = 'video-embed';
      iframe.title = 'Presentación de Andrés Arango';
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + videoId + '?autoplay=1';
      iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      videoButton.replaceWith(iframe);
      iframe.focus();
    });
  }

  var mobileCta = document.querySelector('.mobile-cta');
  var hero = document.querySelector('.hero');
  if (mobileCta && hero && 'IntersectionObserver' in window) {
    var visibleSections = new Set();
    var priceSection = document.querySelector('.price-section');
    var closingSection = document.querySelector('.closing-section');
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visibleSections.add(entry.target);
        else visibleSections.delete(entry.target);
      });
      mobileCta.classList.toggle('is-visible', !visibleSections.has(hero) && !visibleSections.has(priceSection) && !visibleSections.has(closingSection));
    }, { threshold: 0 });
    observer.observe(hero);
    if (priceSection) observer.observe(priceSection);
    if (closingSection) observer.observe(closingSection);
  }
})();
