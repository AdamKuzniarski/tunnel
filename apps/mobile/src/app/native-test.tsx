import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { getAuthorizationStatus, requestAuthorization } from '../services/focusControl';
import type { TunnelAuthorizationStatus } from '../../modules/tunnel-focus-control';

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
      setLastAction(`Requested Family Controls authorization.`);
    } catch (err) {
      console.log('requestAuthorization error', err);
      setError(err instanceof Error ? err.message : JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Permission Debug</Text>

      <Text style={styles.label}>Current status</Text>
      <Text style={styles.value}>{authorizationStatus ?? 'No status loaded yet.'}</Text>

      <Text style={styles.label}>Last action</Text>
      <Text style={styles.value}>{lastAction}</Text>

      {loading ? <Text style={styles.info}>Loading...</Text> : null}
      {loading ? <Text style={styles.error}>Error: {error}</Text> : null}

      <View style={styles.buttonGroup}>
        <Button title={'Get Authorization Status'} onPress={handleGetAuthorizationStatus} />
      </View>

      <View style={styles.buttonGroup}>
        <Button title={'Request authorization'} onPress={handleRequestAuthorization} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
  },
  value: {
    fontSize: 18,
    marginBottom: 8,
  },
  info: {
    fontSize: 16,
  },
  error: {
    fontSize: 16,
  },
  buttonGroup: {
    marginTop: 8,
  },
});
