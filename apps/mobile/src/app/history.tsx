import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { loadSessionHistory } from '@/services/sessionHistoryStorage';
import type { SessionHistoryEntry } from '@/types/sessionHistory';
import { colors, fontFamilies, typography } from '@/theme';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { AppButton } from '@/components/ui/AppButton';
import { Section } from '@/components/ui/Section';

export default function HistoryScreen() {
  const [entries, setEntries] = useState<SessionHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isMountedRef = useRef(true);

  const refreshHistory = useCallback(async () => {
    try {
      if (!isMountedRef.current) {
        return;
      }

      setLoading(true);
      setError('');

      const history = await loadSessionHistory();

      if (!isMountedRef.current) {
        return;
      }

      setEntries(history);
    } catch (err) {
      if (!isMountedRef.current) {
        return;
      }
      setError(err instanceof Error ? err.message : JSON.stringify(err));
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    void refreshHistory();

    return () => {
      isMountedRef.current = false;
    };
  }, [refreshHistory]);

  const handleRefreshPress = useCallback(() => {
    void refreshHistory();
  }, [refreshHistory]);

  return (
    <Screen scroll>
      <Section
        eyebrow="History"
        title="Session history"
        description="Review completed sessions and emergency unlocks."
      >
        <AppButton
          label={loading ? 'Refreshing...' : 'Refresh history'}
          onPress={handleRefreshPress}
          disabled={loading}
          variant="quiet"
        />
      </Section>

      {!loading && entries.length === 0 ? (
        <Section bordered eyebrow="State" title="No history yet">
          <Text style={styles.bodyText}>
            Your completed sessions and unlock events will appear here.
          </Text>
        </Section>
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
  cardLabel: {
    color: colors.mutedForeground,
    fontSize: typography.label,
    fontFamily: fontFamilies.sans.medium,
    textTransform: 'uppercase',
  },
  cardValue: {
    color: colors.foreground,
    fontSize: typography.sectionTitle,
    fontFamily: fontFamilies.mono.medium,
  },
  bodyText: {
    color: colors.muted,
    fontSize: typography.bodySmall,
    lineHeight: 22,
    fontFamily: fontFamilies.sans.regular,
  },
  infoText: {
    color: colors.muted,
    fontSize: typography.bodySmall,
    fontFamily: fontFamilies.sans.regular,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.bodySmall,
    lineHeight: 22,
    fontFamily: fontFamilies.sans.regular,
  },
});
