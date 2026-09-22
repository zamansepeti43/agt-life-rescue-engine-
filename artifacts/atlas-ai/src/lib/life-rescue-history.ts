export interface LifeRescueHistoryItem {
  id: string;
  createdAt: string;
  problem: string;
  category: string;
  goal: string;
  diagnosis: string;
  objective: string;
}

const STORAGE_KEY = "agt_life_rescue_history_v1";
const MAX_ITEMS = 20;

function read(): LifeRescueHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function listLifeRescueHistory(): LifeRescueHistoryItem[] {
  return read();
}

export function saveLifeRescueHistory(item: Omit<LifeRescueHistoryItem, "id" | "createdAt">): LifeRescueHistoryItem {
  const next: LifeRescueHistoryItem = {
    ...item,
    id: typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Date.now().toString(36),
    createdAt: new Date().toISOString(),
  };
  const items = [next, ...read()].slice(0, MAX_ITEMS);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("life-rescue-history-change"));
  } catch {
    // Current session remains usable if storage is unavailable.
  }
  return next;
}

export function clearLifeRescueHistory(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("life-rescue-history-change"));
  } catch {
    // Ignore storage errors.
  }
}
