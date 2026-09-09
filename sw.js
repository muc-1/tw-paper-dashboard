// 紙上交易儀表板 — service worker
// 會變的東西(index.html / *.json / report.html)一律「先網路、失敗才快取」,
// 這樣改版後重新整理一定拿得到新版,不會卡舊快取。
// 只有真正靜態的(manifest / icon)才「先快取」。
const SHELL = 'pt-shell-v3';
const STATIC = ['./manifest.json', './icon-192.png', './icon-512.png'];
const NET_FIRST = ['/', '/index.html', '/data.json', '/xs.json', '/report.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(STATIC)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== SHELL).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  const p = new URL(e.request.url).pathname;
  const netFirst = NET_FIRST.some(x => p === x || p.endsWith(x));
  if (netFirst) {
    e.respondWith(
      fetch(e.request).then(r => {
        const copy = r.clone();
        caches.open(SHELL).then(c => c.put(e.request, copy)).catch(() => {});
        return r;
      }).catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});
