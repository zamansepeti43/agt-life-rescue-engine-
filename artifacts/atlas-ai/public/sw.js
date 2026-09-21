const CACHE = 'atlas-ai-v1';
self.addEventListener('install', (event) => { event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(['/','/manifest.webmanifest']))); self.skipWaiting(); });
self.addEventListener('activate', (event) => { event.waitUntil(self.clients.claim()); });
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data?.text() ?? '' }; }
  const title = data.title || 'İZCİ';
  const options = {
    body: data.body || 'Yeni bir uyarın var.',
    icon: data.icon || '/icon-192.png?v=atlas-gold-2',
    badge: data.badge || '/icon-192.png?v=atlas-gold-2',
    tag: data.tag || 'atlas-izci',
    renotify: Boolean(data.renotify),
    data: { url: data.url || '/izci' },
    actions: Array.isArray(data.actions) ? data.actions.slice(0,2) : [],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/izci';
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    const target = clients.find((client) => 'focus' in client);
    if (target) { target.navigate(url); return target.focus(); }
    return self.clients.openWindow(url);
  }));
});
