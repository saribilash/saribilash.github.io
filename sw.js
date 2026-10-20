// শাড়ি বিলাশ — Service Worker (অ্যাপ ইনস্টল + অফলাইন শেল + অ্যাডমিন নোটিফিকেশন)
const CACHE = "shari-bilash-v2";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./favicon-48.png", "./logo-mark.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // ডাটাবেস/এপিআই/অন্য সাইটের রিকোয়েস্ট কখনো ক্যাশ হবে না (অর্ডার ও প্রোডাক্ট সবসময় লাইভ)
  if (url.origin !== self.location.origin) return;

  // পেজ: আগে নেটওয়ার্ক, না পেলে ক্যাশ করা পেজ
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put("./index.html", copy));
        return res;
      }).catch(() => caches.match("./index.html").then((r) => r || caches.match("./")))
    );
    return;
  }
  // আইকন/ফাইল: ক্যাশ আগে, পাশাপাশি আপডেট
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req).then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});

// নোটিফিকেশনে ক্লিক করলে অ্যাপ খুলবে
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) { if ("focus" in c) return c.focus(); }
      return self.clients.openWindow("./");
    })
  );
});
