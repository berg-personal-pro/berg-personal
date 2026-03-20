const CACHE_NAME = 'berg-pro-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-72x72.png',
  './icons/icon-96x96.png',
  './icons/icon-128x128.png',
  './icons/icon-144x144.png',
  './icons/icon-152x152.png',
  './icons/icon-192x192.png',
  './icons/icon-384x384.png',
  './icons/icon-512x512.png'
];

// Instalação: Pré-cache dos assets essenciais
self.addEventListener('install', event => {
  console.log('[SW] Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cache aberto, adicionando assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Assets em cache');
        return self.skipWaiting();
      })
      .catch(err => console.error('[SW] Erro no cache:', err))
  );
});

// Ativação: Limpar caches antigos
self.addEventListener('activate', event => {
  console.log('[SW] Ativando...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] Deletando cache antigo:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Estratégia Cache First, Network Fallback
self.addEventListener('fetch', event => {
  // Ignorar requisições não-GET e Firebase
  if (event.request.method !== 'GET' || 
      event.request.url.includes('firebase') ||
      event.request.url.includes('google')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Retorna do cache se existir
      if (cachedResponse) {
        console.log('[SW] Cache hit:', event.request.url);
        return cachedResponse;
      }

      // Senão, busca na rede e adiciona ao cache
      return fetch(event.request)
        .then(networkResponse => {
          // Verifica se resposta é válida
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          // Clona e armazena no cache
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(error => {
          console.error('[SW] Fetch falhou:', error);
          // Fallback para offline (página genérica ou mensagem)
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
    })
  );
});

// Sync em background (para quando voltar online)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    console.log('[SW] Sincronizando dados...');
    // Aqui você pode sincronizar dados pendentes
  }
});

// Push notifications (preparado para futuro)
self.addEventListener('push', event => {
  const options = {
    body: event.data?.text() || 'Nova notificação do Berg Personal Pro',
    icon: './icons/icon-192x192.png',
    badge: './icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: { url: './' }
  };

  event.waitUntil(
    self.registration.showNotification('Berg Personal Pro', options)
  );
});

// Clique na notificação
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || './'));
});