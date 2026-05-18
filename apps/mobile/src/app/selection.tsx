import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { TunnelFocusControlView } from '../../modules/tunnel-focus-control';
import type { TunnelSelectionSummary } from '../../modules/tunnel-focus-control';

import { clearSelection, getSelectionSummary } from '@/services/focusControl';
import { colors, radius, spacing, typography } from '@/theme';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { AppButton } from '@/components/ui/AppButton';
import { MetricCard } from '@/components/ui/MetricCard';

type SelectionReturnTarget = 'onboarding' | 'focus-session' | 'home';

export default function SelectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: SelectionReturnTarget }>();

  const [summary, setSummary] = useState<TunnelSelectionSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastAction, setLastAction] = useState('No action yet.');
  const [pickerVersion, setPickerVersion] = useState(0);

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
        console.log('initializeSelection error:', err);
        setError(err instanceof Error ? err.message : JSON.stringify(err));
      } finally {
        setLoading(false);
      }
    };

    void initializeSelection();
  }, []);

  async function handleSelectionChange(nextSummary: TunnelSelectionSummary) {
    setError('');
    setSummary(nextSummary);
    setLastAction('Updated native selection.');
  }

  async function handleClearSelection() {
    try {
      setLoading(true);
      setError('');

      const nextSummary = await clearSelection();

      setSummary(nextSummary);
      setPickerVersion((currentVersion) => currentVersion + 1);
      setLastAction('Cleared native selection.');
    } catch (err) {
      console.log('handleClearSelection error', err);
      setError(err instanceof Error ? err.message : JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  }

  function handleDone() {
    if (params.returnTo === 'onboarding') {
      router.replace('/onboarding');
      return;
    }

    if (params.returnTo === 'focus-session') {
      router.replace('/focus-session');
      return;
    }

    router.replace('/');
  }

  const hasSelection = summary?.hasSelection ?? false;

  return (
    <Screen scroll>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Selection</Text>
        <Text style={styles.title}>Current Selection</Text>
        <Text style={styles.subtitle}>
          Choose what tunnel should block during a focus session. The selection is saved
          automatically.
        </Text>
      </View>

      <Card>
        <Text style={styles.cardLabel}>Selection state</Text>
        <Text style={styles.cardValue}>{hasSelection ? 'Ready' : 'Not ready'}</Text>
        <Text style={styles.cardHint}>
          {hasSelection
            ? 'A native blocklist is available for focus mode.'
            : 'No selection yet. Pick apps, categories, or web domains below.'}
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
        <Text style={styles.cardLabel}>Status</Text>
        <Text style={styles.statusText}>{lastAction}</Text>

        {loading ? <Text style={styles.infoText}>Working...</Text> : null}
        {error ? <Text style={styles.errorText}>Error: {error}</Text> : null}
      </Card>

      <View style={styles.actionsSection}>
        <SectionTitle>Main actions</SectionTitle>

        <AppButton label="Done" onPress={handleDone} disabled={loading} variant="primary" />

        <AppButton
          label="Clear Selection"
          onPress={handleClearSelection}
          disabled={loading || !hasSelection}
          variant="secondary"
        />
      </View>

      <Card>
        <Text style={styles.cardLabel}>Picker</Text>
        <View style={styles.pickerContainer}>
          <TunnelFocusControlView
            key={pickerVersion}
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
