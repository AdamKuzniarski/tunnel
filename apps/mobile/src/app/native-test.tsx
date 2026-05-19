import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { getAuthorizationStatus, requestAuthorization } from '../services/focusControl';
import type { TunnelAuthorizationStatus } from '../../modules/tunnel-focus-control';
import { Screen } from '@/components/ui/Screen';
import { Section } from '@/components/ui/Section';
import { AppButton } from '@/components/ui/AppButton';
import { colors, fontFamilies, typography } from '@/theme';

export default function NativeTestScreen() {
  const [authorizationStatus, setAuthorizationStatus] = useState<TunnelAuthorizationStatus | null>(
    null,
  );
  const [lastAction, setLastAction] = useState('No action yet.');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGetAuthorizationStatus = async () => {
    try {
      setLoading(true);
      setError('');

      const status = await getAuthorizationStatus();
      setAuthorizationStatus(status);
      setLastAction(`Fetched authorization status: ${status}`);
    } catch (err) {
      console.log('getAuthorizationStatus error', err);
      setError(err instanceof Error ? err.message : JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAuthorization = async () => {
    try {
      setLoading(true);
      setError('');

      const status = await requestAuthorization();
      setAuthorizationStatus(status);
      setLastAction('Requested Family Controls authorization.');
    } catch (err) {
      console.log('requestAuthorization error', err);
      setError(err instanceof Error ? err.message : JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <Section
        eyebrow="Debug"
        title="Permission debug"
        description="Use this screen to inspect native authorization state while developing."
      />

      <Section
        bordered
        eyebrow="Current status"
        title={authorizationStatus ?? 'No status loaded yet.'}
      >
        <Text style={styles.valueText}>{lastAction}</Text>
        {loading ? <Text style={styles.infoText}>Loading...</Text> : null}
        {error ? <Text style={styles.errorText}>Error: {error}</Text> : null}
      </Section>

      <Section bordered eyebrow="Actions" title="Native checks">
        <AppButton label="Get authorization status" onPress={handleGetAuthorizationStatus} />
        <AppButton
          label="Request authorization"
          onPress={handleRequestAuthorization}
          variant="secondary"
        />
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  valueText: {
    color: colors.foreground,
    fontSize: typography.body,
    lineHeight: 24,
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
