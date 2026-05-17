import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TunnelFocusControlView } from '../../modules/tunnel-focus-control';
import type { TunnelSelectionSummary } from '../../modules/tunnel-focus-control';
import {
  applyShield,
  clearShield,
  clearSelection,
  getSelectionSummary,
} from '@/services/focusControl';
import { colors, radius, spacing, typography } from '@/theme';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { AppButton } from '@/components/ui/AppButton';
import { MetricCard } from '@/components/ui/MetricCard';

export default function SelectionTestScreen() {
  const [summary, setSummary] = useState<TunnelSelectionSummary | null>(null);
  const [shieldStatus, setShieldStatus] = useState('No shield action yet.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastAction, setLastAction] = useState('No action yet.');

  useEffect(() => {
    const initializeSelection = async () => {
      try {
        setLoading(true);
        setError('');

        const nativeSummary = await getSelectionSummary();
        setSummary(nativeSummary);

        if (nativeSummary.hasSelection) {
          setLastAction('Loaded native selection.');
        } else {
          setLastAction('No native selection found.');
        }
      } catch (err) {
        console.log('loadSelectionSummary error:', err);
        setError(err instanceof Error ? err.message : JSON.stringify(err));
      } finally {
        setLoading(false);
      }
    };

    void initializeSelection();
  }, []);

  async function handleSelectionChange(nextSummary: TunnelSelectionSummary) {
    try {
      setError('');
      setSummary(nextSummary);
      setLastAction('Updated native selection.');
    } catch (err) {
      console.log('saveSelectionSummary error', err);
      setError(err instanceof Error ? err.message : JSON.stringify(err));
    }
  }

  async function handleClearSelection() {
    try {
      setError('');
      const nextSummary = await clearSelection();
      setSummary(nextSummary);
      setLastAction('Cleared native selection.');
    } catch (err) {
      console.log('clearSelectionSummary error', err);
      setError(err instanceof Error ? err.message : JSON.stringify(err));
    }
  }

  async function handleApplyShield() {
    try {
      setError('');
      const result = await applyShield();
      setShieldStatus(`Apply shield result: ${result}`);
    } catch (err) {
      console.log('applyShield error', err);
      setError(err instanceof Error ? err.message : JSON.stringify(err));
    }
  }

  async function handleClearShield() {
    try {
      setError('');
      const result = await clearShield();
      setShieldStatus(`Clear shield result: ${result}`);
    } catch (err) {
      console.log('clearShield error', err);
      setError(err instanceof Error ? err.message : JSON.stringify(err));
    }
  }

  const hasSelection = summary?.hasSelection ?? false;

  return (
    <Screen scroll>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Selection</Text>
        <Text style={styles.title}>Current Selection</Text>
        <Text style={styles.subtitle}>Choose what tunnel should block during a focus session.</Text>
      </View>

      <Card>
        <Text style={styles.cardLabel}>Selection state</Text>
        <Text style={styles.cardValue}>{hasSelection ? 'Ready' : 'Not ready'}</Text>
        <Text style={styles.cardHint}>
          {hasSelection
            ? 'A stored blocklist is available for focus mode.'
            : 'No stored selection yet. Pick apps, categories, or web domains below.'}
        </Text>
      </Card>

      <Card>
        <Text style={styles.cardLabel}>Selection summary</Text>

        <View style={styles.metricsRow}>
          <MetricCard label="Apps" value={summary?.applicationCount ?? 0} />
          <MetricCard label="Categories" value={summary?.categoryCount ?? 0} />
          <MetricCard label="Web" value={summary?.webDomainCount ?? 0} />
        </View>
      </Card>

      <Card>
        <Text style={styles.cardLabel}>Shield status</Text>
        <Text style={styles.statusText}>{shieldStatus}</Text>
      </Card>

      <Card>
        <Text style={styles.cardLabel}>Status</Text>
        <Text style={styles.statusText}>{lastAction}</Text>

        {loading ? <Text style={styles.infoText}>Loading stored selection...</Text> : null}
        {error ? <Text style={styles.errorText}>Error: {error}</Text> : null}
      </Card>

      <View style={styles.actionsSection}>
        <SectionTitle>Main actions</SectionTitle>

        <AppButton
          label="Apply Shield"
          onPress={handleApplyShield}
          disabled={loading || !hasSelection}
          variant="primary"
        />

        <AppButton
          label="Clear Shield"
          onPress={handleClearShield}
          disabled={loading}
          variant="secondary"
        />

        <AppButton
          label="Clear Selection"
          onPress={handleClearSelection}
          disabled={loading}
          variant="secondary"
        />
      </View>

      <Card>
        <Text style={styles.cardLabel}>Picker</Text>
        <View style={styles.pickerContainer}>
          <TunnelFocusControlView
            style={styles.picker}
            onSelectionChange={(event) => {
              void handleSelectionChange(event.nativeEvent);
            }}
          />
        </View>
      </Card>
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
  },
  cardHint: {
    color: colors.muted,
    fontSize: typography.bodySmall,
    lineHeight: 22,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  metricValue: {
    color: colors.foreground,
    fontSize: 28,
    fontWeight: '700',
  },
  metricLabel: {
    color: colors.muted,
    fontSize: typography.label,
    fontWeight: '600',
  },
  statusText: {
    color: colors.foreground,
    fontSize: typography.body,
    lineHeight: 24,
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
  actionsSection: {
    gap: spacing.md,
  },
  pickerContainer: {
    minHeight: 420,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
  },
  picker: {
    flex: 1,
    minHeight: 420,
  },
});
