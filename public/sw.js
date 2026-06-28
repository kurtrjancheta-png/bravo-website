// Service Worker for handling Web Push Notifications

self.addEventListener('push', function(event) {
  if (!event.data) {
    console.log('Push event received but no payload data.');
    return;
  }

  try {
    const payload = event.data.json();
    console.log('Push payload received:', payload);

    const title = payload.title || 'Bravo Company Board Alert';
    
    // Notification options - ensures clean formatting, logo icon, and image attachment if present
    const options = {
      body: payload.body || 'New announcement posted.',
      icon: '/logo.png', // Main company logo
      badge: '/logo.png', // Small icon shown in Android status bars
      vibrate: [100, 50, 100],
      data: {
        url: payload.data?.url || '/'
      }
    };

    // If there is an image (e.g. an uploaded file attachment), display it as a rich card
    if (payload.image) {
      options.image = payload.image;
    }

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('Error handling push notification:', error);
    
    // Fallback if payload isn't JSON
    const fallbackText = event.data.text();
    event.waitUntil(
      self.registration.showNotification('Bravo Company Board Alert', {
        body: fallbackText,
        icon: '/logo.png',
        badge: '/logo.png',
        data: { url: '/' }
      })
    );
  }
});

// User click handler: navigates the user to the exact page/dissemination link
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  const targetUrl = event.notification.data?.url;
  if (!targetUrl) return;

  // Resolve absolute URL
  const absoluteUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      // If a tab is already open on our site, navigate it to the target URL and focus it
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          return client.navigate(absoluteUrl).then(c => c.focus());
        }
      }
      // If no tab is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(absoluteUrl);
      }
    })
  );
});
