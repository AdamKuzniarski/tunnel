import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { loadSessionHistory } from '@/services/sessionHistoryStorage';
import type { SessionHistoryEntry } from '@/types/sessionHistory';
import { colors, fontFamilies, spacing, typography } from '@/theme';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { AppButton } from '@/components/ui/AppButton';

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
      console.log('refreshHistory error', err);
      setError(err instanceof Error ? err.message : JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshHistory();
  }, []);

  return (
    <Screen scroll>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>History</Text>
        <Text style={styles.title}>Session History</Text>
        <Text style={styles.subtitle}>Review completed sessions and emergency unlocks.</Text>
      </View>

      <View style={styles.actions}>
        <AppButton
          label={loading ? 'Refreshing...' : 'Refresh History'}
          onPress={refreshHistory}
          disabled={loading}
          variant="secondary"
        />
      </View>

      {!loading && entries.length === 0 ? (
        <Card>
          <SectionTitle>No history yet</SectionTitle>
          <Text style={styles.bodyText}>
            Your completed sessions and unlock events will appear here.
          </Text>
        </Card>
      ) : null}

      {entries.map((entry) => (
        <Card key={entry.id}>
          <Text style={styles.cardLabel}>{entry.outcome.replace('_', ' ')}</Text>
          <Text style={styles.cardValue}>{entry.durationMinutes} min</Text>
          <Text style={styles.bodyText}>Started: {new Date(entry.startedAt).toLocaleString()}</Text>
          <Text style={styles.bodyText}>Ended: {new Date(entry.endedAt).toLocaleString()}</Text>
        </Card>
      ))}

      {loading ? <Text style={styles.infoText}>Loading history...</Text> : null}
      {error ? <Text style={styles.errorText}>Error: {error}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginTop: spacing['2xl'],
    gap: spacing.xs,
  },
  eyebrow: {
    color: colors.mutedForeground,
    fontSize: typography.label,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.foreground,
    fontSize: typography.title,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.muted,
    fontSize: typography.bodySmall,
    lineHeight: 22,
  },
  actions: {
    gap: spacing.md,
  },
  cardLabel: {
    color: colors.mutedForeground,
    fontSize: typography.label,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cardValue: {
    color: colors.foreground,
    fontSize: typography.sectionTitle,
    fontWeight: '700',
    fontFamily: fontFamilies.mono.medium,
  },
  bodyText: {
    color: colors.muted,
    fontSize: typography.bodySmall,
    lineHeight: 22,
  },
  infoText: {
    color: colors.muted,
    fontSize: typography.bodySmall,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.bodySmall,
    lineHeight: 22,
  },
});
