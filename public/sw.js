// Service Worker for DineFlow PWA

const CACHE_NAME = 'dineflow-v1';
const STATIC_CACHE = 'dineflow-static-v1';
const DYNAMIC_CACHE = 'dineflow-dynamic-v1';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/offline.html'
];

// API endpoints to cache
const API_CACHE = [
  '/api/restaurants',
  '/api/bookings',
  '/api/user/profile'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Static files cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Failed to cache static files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests
  if (url.pathname === '/') {
    // Home page - cache first, then network
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (url.pathname.startsWith('/static/')) {
    // Static assets - cache first, then network
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (url.pathname.startsWith('/api/')) {
    // API requests - network first, then cache
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  } else {
    // Other requests - network first, then cache
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  }
});

// Cache first strategy
async function cacheFirst(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Cache first strategy failed:', error);
    
    // Return offline page for navigation requests
    if (request.destination === 'document') {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

// Network first strategy
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Network first strategy failed:', error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.destination === 'document') {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync-bookings') {
    event.waitUntil(syncOfflineBookings());
  }
});

// Sync offline bookings
async function syncOfflineBookings() {
  try {
    const offlineBookings = await getOfflineBookings();
    
    for (const booking of offlineBookings) {
      try {
        await syncBooking(booking);
      } catch (error) {
        console.error('Failed to sync booking:', error);
      }
    }
    
    // Clear offline bookings after successful sync
    await clearOfflineBookings();
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Get offline bookings from IndexedDB
async function getOfflineBookings() {
  // This would typically use IndexedDB
  // For now, return empty array
  return [];
}

// Sync a single booking
async function syncBooking(booking) {
  const response = await fetch('/api/bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(booking)
  });
  
  if (!response.ok) {
    throw new Error('Failed to sync booking');
  }
  
  return response.json();
}

// Clear offline bookings
async function clearOfflineBookings() {
  // This would typically clear IndexedDB
  console.log('Clearing offline bookings');
}

// Push notification event
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey || 1
      },
      actions: [
        {
          action: 'explore',
          title: 'View Details',
          icon: '/icon-192x192.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/icon-192x192.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    // Open the app to the relevant page
    event.waitUntil(
      clients.openWindow('/bookings')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    event.notification.close();
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE)
        .then((cache) => {
          return cache.addAll(event.data.urls);
        })
    );
  }
  
  if (event.data && event.data.type === 'DELETE_CACHE') {
    event.waitUntil(
      caches.delete(event.data.cacheName)
    );
  }
});

// Error event
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

// Unhandled rejection event
self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason);
});

// Periodic background sync (if supported)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    console.log('Periodic background sync:', event.tag);
    
    if (event.tag === 'content-sync') {
      event.waitUntil(syncContent());
    }
  });
}

// Sync content periodically
async function syncContent() {
  try {
    // Sync restaurants data
    const restaurantsResponse = await fetch('/api/restaurants');
    if (restaurantsResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put('/api/restaurants', restaurantsResponse.clone());
    }
    
    // Sync user profile
    const profileResponse = await fetch('/api/user/profile');
    if (profileResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put('/api/user/profile', profileResponse.clone());
    }
  } catch (error) {
    console.error('Periodic sync failed:', error);
  }
}

// Utility function to check if request is for API
function isApiRequest(url) {
  return url.pathname.startsWith('/api/');
}

// Utility function to check if request is for static assets
function isStaticAsset(url) {
  return url.pathname.startsWith('/static/') ||
         url.pathname.startsWith('/images/') ||
         url.pathname.startsWith('/fonts/') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.png') ||
         url.pathname.endsWith('.jpg') ||
         url.pathname.endsWith('.svg');
}

// Utility function to check if request is for navigation
function isNavigationRequest(request) {
  return request.mode === 'navigate' || request.destination === 'document';
} 