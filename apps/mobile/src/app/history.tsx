import { useEffect, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import { loadSessionHistory, saveSessionHistory } from '@/services/sessionHistoryStorage';
import type { SessionHistoryEntry } from '@/types/sessionHistory';

export default function HistoryScreen() {
  const [entries, setEntries] = useState<SessionHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function refreshHistory() {
    try {
      setLoading(true);
      setError('');

      const history = await loadSessionHistory();
      setEntries(history);
    } catch (err) {
      console.log('refresh');
      setError(err instanceof Error ? err.message : JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  }
}
