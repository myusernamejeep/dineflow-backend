// PWA Configuration and Utilities

// PWA Manifest
export const pwaManifest = {
  name: 'DineFlow - Restaurant Booking System',
  short_name: 'DineFlow',
  description: 'Book your favorite restaurants with ease',
  start_url: '/',
  display: 'standalone',
  background_color: '#ffffff',
  theme_color: '#3498db',
  icons: [
    {
      src: '/icon-192x192.png',
      sizes: '192x192',
      type: 'image/png'
    },
    {
      src: '/icon-512x512.png',
      sizes: '512x512',
      type: 'image/png'
    }
  ]
};

// Service Worker Registration
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
};

// Check if app is installed
export const isAppInstalled = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
};

// Check if app can be installed
export const canInstallApp = () => {
  return 'BeforeInstallPromptEvent' in window;
};

// Install app
export const installApp = async () => {
  if (window.deferredPrompt) {
    window.deferredPrompt.prompt();
    const { outcome } = await window.deferredPrompt.userChoice;
    window.deferredPrompt = null;
    return outcome === 'accepted';
  }
  return false;
};

// PWA Installation Handler
export class PWAInstallHandler {
  constructor() {
    this.deferredPrompt = null;
    this.installButton = null;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('App was installed');
      this.hideInstallButton();
      this.deferredPrompt = null;
    });
  }

  setInstallButton(button) {
    this.installButton = button;
    if (this.deferredPrompt) {
      this.showInstallButton();
    }
  }

  showInstallButton() {
    if (this.installButton) {
      this.installButton.style.display = 'block';
    }
  }

  hideInstallButton() {
    if (this.installButton) {
      this.installButton.style.display = 'none';
    }
  }

  async install() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;
      return outcome === 'accepted';
    }
    return false;
  }
}

// Offline Detection
export class OfflineHandler {
  constructor() {
    this.isOnline = navigator.onLine;
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.handleOnline();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.handleOffline();
    });
  }

  handleOnline() {
    console.log('App is back online');
    this.showOnlineNotification();
    this.syncOfflineData();
  }

  handleOffline() {
    console.log('App is offline');
    this.showOfflineNotification();
  }

  showOnlineNotification() {
    // Show online notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('DineFlow', {
        body: 'You are back online!',
        icon: '/icon-192x192.png'
      });
    }
  }

  showOfflineNotification() {
    // Show offline notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('DineFlow', {
        body: 'You are offline. Some features may be limited.',
        icon: '/icon-192x192.png'
      });
    }
  }

  syncOfflineData() {
    // Sync any offline data when back online
    const offlineBookings = JSON.parse(localStorage.getItem('offlineBookings') || '[]');
    if (offlineBookings.length > 0) {
      // Sync offline bookings
      this.syncBookings(offlineBookings);
    }
  }

  async syncBookings(bookings) {
    try {
      for (const booking of bookings) {
        // Attempt to sync each booking
        await this.syncBooking(booking);
      }
      // Clear offline bookings after successful sync
      localStorage.removeItem('offlineBookings');
    } catch (error) {
      console.error('Failed to sync offline bookings:', error);
    }
  }

  async syncBooking(booking) {
    // Implement booking sync logic
    console.log('Syncing booking:', booking);
  }
}

// Push Notifications
export class PushNotificationHandler {
  constructor() {
    this.registration = null;
  }

  async requestPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  async subscribeToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications not supported');
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.ready;
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.VAPID_PUBLIC_KEY)
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  async sendSubscriptionToServer(subscription) {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription)
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
      return false;
    }
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// Cache Management
export class CacheManager {
  constructor() {
    this.cacheName = 'dineflow-v1';
  }

  async cacheResources(resources) {
    if ('caches' in window) {
      try {
        const cache = await caches.open(this.cacheName);
        await cache.addAll(resources);
        console.log('Resources cached successfully');
      } catch (error) {
        console.error('Failed to cache resources:', error);
      }
    }
  }

  async getCachedResponse(request) {
    if ('caches' in window) {
      try {
        const cache = await caches.open(this.cacheName);
        return await cache.match(request);
      } catch (error) {
        console.error('Failed to get cached response:', error);
        return null;
      }
    }
    return null;
  }

  async cacheResponse(request, response) {
    if ('caches' in window) {
      try {
        const cache = await caches.open(this.cacheName);
        await cache.put(request, response.clone());
      } catch (error) {
        console.error('Failed to cache response:', error);
      }
    }
  }

  async clearCache() {
    if ('caches' in window) {
      try {
        await caches.delete(this.cacheName);
        console.log('Cache cleared successfully');
      } catch (error) {
        console.error('Failed to clear cache:', error);
      }
    }
  }
}

// PWA Initialization
export class PWAInitializer {
  constructor() {
    this.installHandler = new PWAInstallHandler();
    this.offlineHandler = new OfflineHandler();
    this.pushHandler = new PushNotificationHandler();
    this.cacheManager = new CacheManager();
  }

  async initialize() {
    try {
      // Register service worker
      await registerServiceWorker();

      // Cache essential resources
      await this.cacheManager.cacheResources([
        '/',
        '/index.html',
        '/static/js/bundle.js',
        '/static/css/main.css',
        '/icon-192x192.png',
        '/icon-512x512.png'
      ]);

      // Request notification permission
      await this.pushHandler.requestPermission();

      console.log('PWA initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PWA:', error);
    }
  }

  getInstallHandler() {
    return this.installHandler;
  }

  getOfflineHandler() {
    return this.offlineHandler;
  }

  getPushHandler() {
    return this.pushHandler;
  }

  getCacheManager() {
    return this.cacheManager;
  }
}

// Export PWA utilities
export const pwaUtils = {
  registerServiceWorker,
  isAppInstalled,
  canInstallApp,
  installApp,
  PWAInstallHandler,
  OfflineHandler,
  PushNotificationHandler,
  CacheManager,
  PWAInitializer
}; 