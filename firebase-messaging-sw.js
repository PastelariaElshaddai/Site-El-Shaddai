importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBI8b8lsxrlR1WripolJzGqGVFVxpo',
  authDomain: 'pizzaria-ele-shaddar-e-cia.firebaseapp.com',
  projectId: 'pizzaria-ele-shaddar-e-cia',
  storageBucket: 'pizzaria-ele-shaddar-e-cia.firebasestorage.app',
  messagingSenderId: '288093351919',
  appId: '1:288093351919:web:b701199ba916ebfdbfd01a'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const n = payload.notification || {};
  const title = data.title || n.title || 'Novo pedido recebido';
  const body = data.body || n.body || 'Chegou um novo pedido na loja.';
  self.registration.showNotification(title, {
    body,
    icon: '/Site-El-Shaddai/Logo.png',
    badge: '/Site-El-Shaddai/Logo.png',
    requireInteraction: true,
    renotify: true,
    silent: false,
    tag: data.orderId ? 'pedido-' + data.orderId : 'novo-pedido',
    data: { url: data.url || '/Site-El-Shaddai/admin.html' }
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/Site-El-Shaddai/admin.html';
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const client of list) {
      if ('focus' in client) { client.navigate(target); return client.focus(); }
    }
    return clients.openWindow(target);
  }));
});
