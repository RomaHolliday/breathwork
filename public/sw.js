self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'The Gauntlet';
  const options = {
    body: data.body || 'Time for your next stone.',
    icon: '/icon.png',
    badge: '/icon.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: 'gauntlet-timer',
    renotify: true,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
