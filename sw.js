const CACHE = "lulu-v12";
const SHELL = ["./", "./index.html", "./manifest.webmanifest"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.hostname.endsWith("supabase.co")) return;
  if (u.origin !== location.origin && !/jsdelivr|googleapis|gstatic/.test(u.hostname)) return;
  const page = e.request.mode === "navigate" || u.pathname.endsWith("/index.html");
  if (page) {
    // Sempre tenta a versão nova primeiro; só usa a cópia guardada se estiver sem internet
    e.respondWith(
      fetch(new Request(u.href, { cache: "no-store" }))
        .then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put("./index.html", c)); return r; })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(hit => {
      const net = fetch(e.request).then(r => {
        if (r && (r.ok || r.type === "opaque")) { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); }
        return r;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
