import { notificationPermission } from "./notifications";
import { scheduleNativeNotification } from "./native-notifications";

const DEVICE_KEY = "atlas_push_device_id_v1";

const device = () => {
  if (typeof window === "undefined") return "";
  const x = localStorage.getItem(DEVICE_KEY);
  if (x) return x;
  const id = crypto.randomUUID();
  localStorage.setItem(DEVICE_KEY, id);
  return id;
};

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const r = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    return r;
  } catch {
    return null;
  }
}

const decode = (v: string) => {
  const normalized = v.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
};

export async function subscribeToPush() {
  const r = await registerServiceWorker();
  if (!r || !("PushManager" in window) || notificationPermission() !== "granted") return null;
  try {
    let sub = await r.pushManager.getSubscription();
    const k = await fetch("/api/notifications/push/public-key");
    if (!k.ok) return null;
    const { publicKey } = await k.json() as { publicKey: string };
    if (!sub) sub = await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decode(publicKey) });
    const saved = await fetch("/api/notifications/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId: device(), subscription: sub.toJSON() })
    });
    return saved.ok ? sub : null;
  } catch {
    return null;
  }
}

export async function schedulePushNotification(input: {
  id: string;
  kind: "task" | "reminder" | "life-rescue";
  scheduledAt: string;
  recurrence?: "daily" | "weekly" | "monthly";
  title: string;
  body: string;
  url?: string;
}) {
  if (scheduleNativeNotification(input)) return true;
  if (!device() || !input.scheduledAt) return false;
  try {
    const r = await fetch("/api/notifications/push/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId: device(),
        id: input.id,
        kind: input.kind,
        recurrence: input.recurrence,
        scheduledAt: input.scheduledAt,
        payload: {
          title: input.title,
          body: input.body,
          url: input.url ?? "/izci",
          tag: `atlas-${input.kind}-${input.id}`,
          renotify: true,
          actions: [{ action: "open", title: "Aç" }]
        }
      })
    });
    return r.ok;
  } catch {
    return false;
  }
}
