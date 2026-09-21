const SUPPORTS_NOTIFICATIONS = typeof window !== 'undefined' && 'Notification' in window;

export function notificationSupported(): boolean {
  return SUPPORTS_NOTIFICATIONS;
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  return SUPPORTS_NOTIFICATIONS ? Notification.permission : 'unsupported';
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!SUPPORTS_NOTIFICATIONS) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  return Notification.requestPermission();
}

export async function enableReliableNotifications(): Promise<NotificationPermission | 'unsupported'> {
  if (!SUPPORTS_NOTIFICATIONS) return 'unsupported';
  const permission = await requestNotificationPermission();
  if (permission === 'granted' && 'serviceWorker' in navigator) {
    try { await navigator.serviceWorker.ready; } catch {}
  }
  return permission;
}

export function sendBrowserNotification(title: string, body: string): boolean {
  if (!SUPPORTS_NOTIFICATIONS || Notification.permission !== 'granted') return false;
  try {
    new Notification(title, { body, tag: `atlas-${Date.now()}` });
    return true;
  } catch { return false; }
}
