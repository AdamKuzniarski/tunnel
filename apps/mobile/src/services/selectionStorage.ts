import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FocusSession } from '../types/session';

const ACTIVE_SESSION_KEY = 'tunnel:active-session';

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
