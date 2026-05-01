import { useEffect, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import { loadSessionHistory } from '@/services/sessionHistoryStorage';
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

  useEffect(() => {
    void refreshHistory();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Session History</Text>

      <View style={styles.actionButton}>
        <Button title="Refresh" onPress={refreshHistory} disabled={loading} />
      </View>

      {loading ? <Text style={styles.info}>Loading...</Text> : null}
      {error ? <Text style={styles.error}>Error: {error}</Text> : null}

      <ScrollView style={styles.list}>
        {entries.length === 0 ? (
          <Text style={styles.info}>No history yet.</Text>
        ) : (
          entries.map((entry) => (
            <View key={entry.id} style={styles.entry}>
              <Text style={styles.entryTitle}>{entry.outcome}</Text>
              <Text style={styles.entryText}>Duration: {entry.durationMinutes} min</Text>
              <Text style={styles.entryText}>
                Ended: {new Date(entry.endedAt).toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  actionButton: {
    marginBottom: 8,
  },
  list: {
    flex: 1,
  },
  entry: {
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  entryText: {
    fontSize: 14,
    marginTop: 4,
  },
  info: {
    fontSize: 16,
  },
  error: {
    fontSize: 16,
  },
});
