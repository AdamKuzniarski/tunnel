import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TunnelSelectionSummary } from '../../modules/tunnel-focus-control';

const SELECTION_SUMMARY_KEY = 'tunnel:selection-summary';

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
