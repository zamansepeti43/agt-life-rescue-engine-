export type NativeNotificationInput = {
  id: string;
  title: string;
  body: string;
  scheduledAt: string;
  url?: string;
};

type AndroidBridge = {
  scheduleNotification?: (payload: string) => void;
  cancelNotification?: (id: string) => void;
};

function bridge(): AndroidBridge | null {
  if (typeof window === "undefined") return null;
  const candidate = (window as Window & { AndroidLocalNotifications?: AndroidBridge }).AndroidLocalNotifications;
  return candidate ?? null;
}

export function isNativeNotificationAvailable(): boolean {
  return Boolean(bridge()?.scheduleNotification);
}

export function scheduleNativeNotification(input: NativeNotificationInput): boolean {
  const target = new Date(input.scheduledAt).getTime();
  if (!Number.isFinite(target) || target <= Date.now()) return false;
  const api = bridge();
  if (!api?.scheduleNotification) return false;
  try {
    api.scheduleNotification(JSON.stringify(input));
    return true;
  } catch {
    return false;
  }
}

export function cancelNativeNotification(id: string): boolean {
  const api = bridge();
  if (!api?.cancelNotification) return false;
  try {
    api.cancelNotification(id);
    return true;
  } catch {
    return false;
  }
}
