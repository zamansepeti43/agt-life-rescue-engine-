import { notificationPermission } from './notifications';

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try { return await navigator.serviceWorker.register('/sw.js', { scope: '/' }); } catch { return null; }
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  const registration = await registerServiceWorker();
  if (!registration || !('PushManager' in window)) return null;
  const permission = notificationPermission();
  if (permission !== 'granted') return null;
  try { return await registration.pushManager.getSubscription(); } catch { return null; }
}
