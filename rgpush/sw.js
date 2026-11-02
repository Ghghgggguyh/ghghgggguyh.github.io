// Служебный файл RomGramm для пуш-уведомлений (прямой Web Push)
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('push', function (event) {
    let d = {};
    try { d = event.data ? event.data.json() : {}; } catch (e) { d = { title: 'RomGramm', message: event.data ? event.data.text() : '' }; }
    const call = !!d.call;
    event.waitUntil((async function () {
        // Если приложение открыто и на экране, свои уведомления оно показывает само (кроме звонка)
        try {
            const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
            const focused = list.some(function (c) { return c.focused && c.visibilityState === 'visible'; });
            if (focused && !call) return;
        } catch (e) {}
        await self.registration.showNotification(d.title || 'RomGramm', {
            body: d.message || '',
            tag: call ? 'rg-call' : (d.tag || undefined),
            renotify: true,
            requireInteraction: call,
            vibrate: call ? [400, 200, 400, 200, 400] : [150],
            data: { url: d.url || '/' }
        });
    })());
});
self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    const url = (event.notification.data && event.notification.data.url) || '/';
    event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
        for (const c of list) { if ('focus' in c) return c.focus(); }
        return self.clients.openWindow(url);
    }));
});
