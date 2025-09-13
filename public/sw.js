// Service Worker for TuniMove Departure Notifications
const CACHE_NAME = 'tunimove-notifications-v1';

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'Departure reminder',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: data.tag || 'departure-reminder',
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'View Details',
          icon: '/favicon.ico'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/favicon.ico'
        }
      ],
      data: {
        url: data.url || '/user/dashboard',
        bookingId: data.bookingId
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Departure Reminder', options)
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// Background sync for offline notifications
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event);
  
  if (event.tag === 'departure-notification') {
    event.waitUntil(syncDepartureNotifications());
  }
});

// Function to sync departure notifications
async function syncDepartureNotifications() {
  try {
    // Get stored notifications from IndexedDB or localStorage
    const storedNotifications = await getStoredNotifications();
    
    for (const notification of storedNotifications) {
      // Send notification to backend
      await sendNotificationToBackend(notification);
    }
    
    console.log('Departure notifications synced successfully');
  } catch (error) {
    console.error('Failed to sync departure notifications:', error);
  }
}

// Helper function to get stored notifications
async function getStoredNotifications() {
  // This would typically use IndexedDB
  // For now, return empty array
  return [];
}

// Helper function to send notification to backend
async function sendNotificationToBackend(notification) {
  try {
    const response = await fetch('/api/notifications/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(notification)
    });
    
    if (response.ok) {
      console.log('Notification sent to backend successfully');
    }
  } catch (error) {
    console.error('Failed to send notification to backend:', error);
  }
}

// Message event for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
}); 