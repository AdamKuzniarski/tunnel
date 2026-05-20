import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { AppButton } from '@/components/ui/AppButton';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  applyShield,
  clearShield,
  getAuthorizationStatus,
  getSelectionSummary,
  requestAuthorization,
} from '@/services/focusControl';
import { saveOnboardingCompleted } from '@/services/onBoardingStorage';
import { colors, fontFamilies, typography } from '@/theme';

import type {
  TunnelAuthorizationStatus,
  TunnelSelectionSummary,
} from '../../modules/tunnel-focus-control';

type TestShieldState = 'idle' | 'passed' | 'failed';

function isAuthorizationApproved(status: TunnelAuthorizationStatus): boolean {
  return status === 'approved' || status === 'approvedWithDataAccess';
}

function getPermissionCopy(status: TunnelAuthorizationStatus): string {
  switch (status) {
    case 'approved':
    case 'approvedWithDataAccess':
      return 'Screen Time permission is ready.';
    case 'denied':
      return 'Permission was denied. You need Screen Time access before tunnel can block apps.';
    case 'notDetermined':
      return 'tunnel needs Screen Time permission to block selected distractions.';
    case 'unsupported':
      return 'This device does not support the required Screen Time APIs.';
    case 'unknown':
    default:
      return 'Permission status is unknown. Try checking again.';
  }
}

export default function OnboardingScreen() {
  const router = useRouter();

  const [authorizationStatus, setAuthorizationStatus] =
    useState<TunnelAuthorizationStatus>('unknown');
  const [selectionSummary, setSelectionSummary] = useState<TunnelSelectionSummary | null>(null);
  const [testShieldState, setTestShieldState] = useState<TestShieldState>('idle');
  const [loading, setLoading] = useState(false);
  const [lastAction, setLastAction] = useState('Setup not started yet.');
  const [error, setError] = useState('');

  const authorizationReady = isAuthorizationApproved(authorizationStatus);
  const selectionReady = Boolean(selectionSummary?.hasSelection);
  const testShieldPassed = testShieldState === 'passed';

  const setupComplete = authorizationReady && selectionReady && testShieldPassed;

  const permissionText = useMemo(() => {
    return getPermissionCopy(authorizationStatus);
  }, [authorizationStatus]);

  async function refreshSetupState() {
    try {
      setLoading(true);
      setError('');

      const [status, summary] = await Promise.all([
        getAuthorizationStatus(),
        getSelectionSummary(),
      ]);

      setAuthorizationStatus(status);
      setSelectionSummary(summary);
      setLastAction('Setup state refreshed.');
    } catch (err) {
      console.log('refreshSetupState error:', err);
      setError(err instanceof Error ? err.message : JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshSetupState();
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshSetupState();
    }, []),
  );

  async function handleRequestPermission() {
    try {
      setLoading(true);
      setError('');

      const status = await requestAuthorization();
      setAuthorizationStatus(status);
      setLastAction(`Permission result: ${status}`);
    } catch (err) {
      console.log('requestAuthorization error:', err);
      setError(err instanceof Error ? err.message : JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleTestShield() {
    try {
      setLoading(true);
      setError('');
      setTestShieldState('idle');

      const applyResult = await applyShield();

      if (applyResult !== 'applied') {
        setTestShieldState('failed');
        setLastAction(`Test shield failed: ${applyResult}`);
        return;
      }

      const clearResult = await clearShield();

      setTestShieldState('passed');
      setLastAction(`Test shield passed. Clear result: ${clearResult}`);
    } catch (err) {
      console.log('handleTestShield error:', err);
      setTestShieldState('failed');
      setError(err instanceof Error ? err.message : JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleFinishSetup() {
    try {
      setLoading(true);
      setError('');

      await saveOnboardingCompleted();
      router.replace('/focus-session');
    } catch (err) {
      console.log('handleFinishSetup error:', err);
      setError(err instanceof Error ? err.message : JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll>
      <PageHeader
        eyebrow="Setup"
        title="Prepare your first tunnel"
        description="Set up Screen Time permission, choose your blocklist, test the shield, then start your first focused session."
      />

      <Card>
        <Text style={styles.label}>Step 1</Text>
        <Text style={styles.stepTitle}>Screen Time permission</Text>
        <Text style={styles.infoText}>{permissionText}</Text>
        <Text style={styles.statusText}>Current status: {authorizationStatus}</Text>

        <AppButton
          label={authorizationReady ? 'Permission ready' : 'Request permission'}
          onPress={handleRequestPermission}
          disabled={loading || authorizationReady || authorizationStatus === 'unsupported'}
          variant={authorizationReady ? 'secondary' : 'primary'}
        />
      </Card>

      <Card>
        <Text style={styles.label}>Step 2</Text>
        <Text style={styles.stepTitle}>Choose blocklist</Text>
        <Text style={styles.infoText}>
          Pick the apps, categories, or web domains tunnel should block during focus sessions.
        </Text>
        <Text style={styles.statusText}>
          {selectionReady
            ? `${selectionSummary?.applicationCount ?? 0} apps • ${
                selectionSummary?.categoryCount ?? 0
              } categories • ${selectionSummary?.webDomainCount ?? 0} web domains`
            : 'No native selection found yet.'}
        </Text>

        <AppButton
          label={selectionReady ? 'Update selection' : 'Choose selection'}
          onPress={() =>
            router.push({ pathname: '/selection', params: { returnTo: 'onboarding' } })
          }
          disabled={loading || !authorizationReady}
          variant={selectionReady ? 'secondary' : 'primary'}
        />
      </Card>

      <Card>
        <Text style={styles.label}>Step 3</Text>
        <Text style={styles.stepTitle}>Test shield</Text>
        <Text style={styles.infoText}>
          tunnel applies the shield once and clears it immediately. This verifies the native bridge
          works.
        </Text>
        <Text style={styles.statusText}>
          Test status:{' '}
          {testShieldState === 'passed'
            ? 'passed'
            : testShieldState === 'failed'
              ? 'failed'
              : 'not tested'}
        </Text>

        <AppButton
          label={testShieldPassed ? 'Shield test passed' : 'Test shield'}
          onPress={handleTestShield}
          disabled={loading || !authorizationReady || !selectionReady || testShieldPassed}
          variant={testShieldPassed ? 'secondary' : 'primary'}
        />
      </Card>

      <Card>
        <Text style={styles.label}>Step 4</Text>
        <Text style={styles.stepTitle}>Start first session</Text>
        <Text style={styles.infoText}>
          When setup is complete, start your first 30-minute tunnel session.
        </Text>
        <AppButton
          label="Start first 30-minute session"
          onPress={handleFinishSetup}
          disabled={loading || !setupComplete}
          variant="primary"
        />
      </Card>

      <Card>
        <Text style={styles.label}>Setup activity</Text>
        <Text style={styles.statusText}>{lastAction}</Text>
        {loading ? <Text style={styles.infoText}>Working...</Text> : null}
        {error ? <Text style={styles.errorText}>Error: {error}</Text> : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.mutedForeground,
    fontSize: typography.label,
    fontFamily: fontFamilies.sans.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepTitle: {
    color: colors.foreground,
    fontSize: typography.sectionTitle,
    fontFamily: fontFamilies.sans.semibold,
  },
  statusText: {
    color: colors.foreground,
    fontSize: typography.bodySmall,
    lineHeight: 22,
    fontFamily: fontFamilies.sans.regular,
  },
  infoText: {
    color: colors.mutedForeground,
    fontSize: typography.bodySmall,
    fontFamily: fontFamilies.sans.regular,
    lineHeight: 22,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.bodySmall,
    lineHeight: 22,
    fontFamily: fontFamilies.sans.regular,
  },
});
