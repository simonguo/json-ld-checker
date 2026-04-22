// History storage for visited pages with JSON-LD validation results

export interface HistoryEntry {
  url: string;
  title: string;
  timestamp: number;
  jsonLdCount: number;
  errorCount: number;
  warningCount: number;
  suggestionCount: number;
  types: string[];
}

const HISTORY_KEY = 'page_history';
const MAX_HISTORY = 30;

export async function addHistoryEntry(entry: HistoryEntry): Promise<void> {
  const history = await getHistory();
  // Remove existing entry for same URL (dedup)
  const filtered = history.filter((h) => h.url !== entry.url);
  // Add to front, limit to MAX_HISTORY
  const updated = [entry, ...filtered].slice(0, MAX_HISTORY);
  await chrome.storage.local.set({ [HISTORY_KEY]: updated });
}

export async function getHistory(): Promise<HistoryEntry[]> {
  const result = await chrome.storage.local.get([HISTORY_KEY]);
  return (result[HISTORY_KEY] as HistoryEntry[]) || [];
}

export async function clearHistory(): Promise<void> {
  await chrome.storage.local.remove([HISTORY_KEY]);
}
