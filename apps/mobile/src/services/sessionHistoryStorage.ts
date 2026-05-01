import AsyncStorage from '@react-native-async-storage/async-storage';
import { SessionHistoryEntry } from '@/types/sessionHistory';

const SESSION_HISTORY_KEY = 'tunnel:session-history';

export async function loadSessionHistory(): Promise<SessionHistoryEntry[]> {
  const rawValue = await AsyncStorage.getItem(SESSION_HISTORY_KEY);

  if (!rawValue) {
    return [];
  }

  return JSON.parse(rawValue) as SessionHistoryEntry[];
}

export async function saveSessionHistory(entries: SessionHistoryEntry[]): Promise<void> {
  await AsyncStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(entries));
}

export async function appendSessionHistoryEntry(entry: SessionHistoryEntry): Promise<void> {
  const existingEntries = await loadSessionHistory();
  const nextEntries = [entry, ...existingEntries];
  await saveSessionHistory(nextEntries);
}
