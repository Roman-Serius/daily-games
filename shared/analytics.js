// Visitor stats via GoatCounter (no cookies, no personal data).
// Turned on by setting SITE.goatcounter in shared/games.js.
// Pages are counted automatically. Games can also send events:
//   track("caesarle/win", "Caesarle win")
// Events show up in the GoatCounter dashboard next to the pages.
(function () {
  const code = window.SITE && window.SITE.goatcounter;
  const local = /^(localhost|127\.|192\.168\.|10\.)/.test(location.hostname) || location.protocol === "file:";
  const on = !!code && !(window.Daily && Daily.TEST) && !local;
  const queue = [];

  window.track = function (path, title) {
    if (!on) return;
    const send = () => window.goatcounter.count({ path, title: title || path, event: true });
    if (window.goatcounter && window.goatcounter.count) send();
    else queue.push(send);
  };

  if (!on) return;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://gc.zgo.at/count.js";
  s.dataset.goatcounter = `https://${code}.goatcounter.com/count`;
  s.onload = () => {
    const wait = setInterval(() => {
      if (!window.goatcounter || !window.goatcounter.count) return;
      clearInterval(wait);
      queue.splice(0).forEach((f) => f());
    }, 100);
  };
  document.head.appendChild(s);
})();
