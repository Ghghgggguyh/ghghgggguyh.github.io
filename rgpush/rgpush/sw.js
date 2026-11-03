// Служебный файл RomGramm для пуш-уведомлений (прямой Web Push)
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

// Журнал событий (его можно посмотреть в приложении: Настройки -> Пуш-уведомления -> Журнал)
async function rgLog(msg) {
    try {
        const c = await caches.open('rg-log');
        const key = self.location.origin + '/rgpush/rg-log';
        const r = await c.match(key);
        let arr = [];
        if (r) { try { arr = await r.json(); } catch (e) { arr = []; } }
        arr.unshift({ t: Date.now(), m: String(msg).slice(0, 160) });
        await c.put(key, new Response(JSON.stringify(arr.slice(0, 15))));
    } catch (e) {}
}

self.addEventListener('push', function (event) {
    event.waitUntil((async function () {
        await rgLog('Пуш получен');
        let d = {};
        try { d = event.data ? event.data.json() : {}; } catch (e) { d = { title: 'RomGramm', message: event.data ? event.data.text() : '' }; }
        const call = !!d.call;
        const title = d.title || 'RomGramm';
        // Если приложение открыто и на экране, свои уведомления оно показывает само (кроме звонка)
        try {
            const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
            const focused = list.some(function (c) { return c.focused && c.visibilityState === 'visible'; });
            if (focused && !call) { await rgLog('Не показано: приложение открыто на экране'); return; }
        } catch (e) {}
        try {
            await self.registration.showNotification(title, {
                body: d.message || '',
                tag: call ? 'rg-call' : (d.tag || ('rg-msg-' + Date.now())),
                renotify: true,
                requireInteraction: call,
                vibrate: call ? [400, 200, 400, 200, 400] : [150],
                data: { url: d.url || '/' }
            });
            await rgLog('Уведомление показано: ' + title);
        } catch (e) {
            await rgLog('Ошибка показа: ' + (e && e.name) + ' ' + (e && e.message));
            try {
                await self.registration.showNotification(title, { body: d.message || '' });
                await rgLog('Уведомление показано (упрощённо)');
            } catch (e2) {
                await rgLog('Ошибка упрощённого показа: ' + (e2 && e2.name) + ' ' + (e2 && e2.message));
            }
        }
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
