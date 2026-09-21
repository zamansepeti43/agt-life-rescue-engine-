import type { CollectedContext, ConversationMessage } from './conversation-engine';
import { parseConversationState, type PersistedConversationState } from './conversation-storage';

export interface ConversationHistoryItem {
  id: string;
  title: string;
  updatedAt: string;
  state: PersistedConversationState;
}

const KEY = 'atlas_conversation_history_v1';
const LIMIT = 30;

function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function read(): ConversationHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is ConversationHistoryItem => Boolean(item && typeof item.id === 'string' && typeof item.title === 'string' && item.state));
  } catch { return []; }
}

function write(items: ConversationHistoryItem[]) {
  try { window.localStorage.setItem(KEY, JSON.stringify(items.slice(0, LIMIT))); } catch {}
}

export function listConversationHistory(): ConversationHistoryItem[] {
  return read().sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function upsertConversation(state: PersistedConversationState, id?: string): string {
  const firstUser = state.messages.find((message) => message.role === 'user');
  if (!firstUser) return id ?? '';
  const existing = read();
  const itemId = id ?? existing[0]?.id ?? uid();
  const title = firstUser.content.trim().replace(/\s+/g, ' ').slice(0, 58) || 'Yeni sohbet';
  const next: ConversationHistoryItem = { id: itemId, title, updatedAt: new Date().toISOString(), state };
  write([next, ...existing.filter((item) => item.id !== itemId)]);
  return itemId;
}

export function getConversation(id: string): ConversationHistoryItem | null {
  return read().find((item) => item.id === id) ?? null;
}

export function deleteConversation(id: string): void {
  write(read().filter((item) => item.id !== id));
}
