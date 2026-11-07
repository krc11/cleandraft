// Loads AdSense after the page is interactive and fills each slot once as it nears the
// viewport. Runs per page load only: a tool run is not a pageview and never refreshes ads.
(function () {
  var client = document.currentScript.dataset.client;
  function start() {
    var script = document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(client);
    document.head.appendChild(script);
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        });
      },
      { rootMargin: '300px' }
    );
    document.querySelectorAll('ins.adsbygoogle').forEach(function (el) {
      observer.observe(el);
    });
  }
  if (document.readyState === 'complete') setTimeout(start, 1500);
  else window.addEventListener('load', function () { setTimeout(start, 1500); });
})();
