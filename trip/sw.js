// 山間部で電波が切れても、しおりだけは開けるようにする。
const CACHE = "trip-2026-09-v2";
const ASSETS = ["./", "./index.html"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ネットワーク優先。つながらないときだけキャッシュを返す。
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  // ページ本体はブラウザのHTTPキャッシュを素通りさせ、必ずサーバーに問い合わせる。
  // これをしないと、更新しても最大10分は古い版が表示され続ける。
  const isDoc = e.request.mode === "navigate" || e.request.destination === "document";
  const req = isDoc
    ? new Request(e.request.url, { cache: "no-cache", credentials: "same-origin" })
    : e.request;

  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then((hit) => hit || caches.match("./index.html")))
  );
});
