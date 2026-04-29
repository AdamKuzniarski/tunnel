import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FocusSession } from '../types/session';
import type { TunnelSelectionSummary } from '../../modules/tunnel-focus-control';

const ACTIVE_SESSION_KEY = 'tunnel:active-session';
const SELECTION_SUMMARY_KEY = 'tunnel:selection-summary';

export async function saveActiveSession(session: FocusSession): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
}

export async function loadActiveSession(): Promise<FocusSession | null> {
  const rawValue = await AsyncStorage.getItem(ACTIVE_SESSION_KEY);

  if (!rawValue) {
    return null;
  }

  return JSON.parse(rawValue) as FocusSession;
}

export async function clearActiveSession(): Promise<void> {
  await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);
}

export async function saveSelectionSummary(summary: TunnelSelectionSummary): Promise<void> {
  await AsyncStorage.setItem(SELECTION_SUMMARY_KEY, JSON.stringify(summary));
}

export async function loadSelectionSummary(): Promise<TunnelSelectionSummary | null> {
  const rawValue = await AsyncStorage.getItem(SELECTION_SUMMARY_KEY);

  if (!rawValue) {
    return null;
  }

  return JSON.parse(rawValue) as TunnelSelectionSummary;
}

export async function clearSelectionSummary(): Promise<void> {
  await AsyncStorage.removeItem(SELECTION_SUMMARY_KEY);
}

