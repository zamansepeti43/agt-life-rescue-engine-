export interface RescueMemory {
  problem: string;
  category: string;
  goal: string;
  priority: string;
  createdAt: string;
  completedActions: string[];
}

const KEY = "agt-life-rescue-memory-v1";

export function loadRescueMemory(): RescueMemory[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) as RescueMemory[] : [];
  } catch {
    return [];
  }
}

export function saveRescueMemory(item: RescueMemory): void {
  try {
    const current = loadRescueMemory();
    localStorage.setItem(KEY, JSON.stringify([item, ...current].slice(0, 50)));
  } catch {
    // Offline storage is optional; the engine itself must remain usable.
  }
}
