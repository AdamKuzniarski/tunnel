import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { getAuthorizationStatus, requestAuthorization } from '../services/focusControl';

export default function NativeTestScreen() {
  const [result, setResult] = useState('No native call yet.');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGetAuthorizationStatus = async () => {
    try {
      setLoading(true);
      const status = await getAuthorizationStatus();
      setResult(`Authorization status: ${status}`);
      setError('');
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
      setResult(`Authorization requested. Current status: ${status}`);
    } catch (err) {
      console.log('requestAuthorization error', err);
      setError(err instanceof Error ? err.message : JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Native Test</Text>
      <Text style={styles.text}>{result}</Text>
      {loading ? <Text style={styles.text}>Loading...</Text> : null}
      {error ? <Text style={styles.error}>Error: {error}</Text> : null}

      <Button title="Get authorization status" onPress={handleGetAuthorizationStatus} />
      <View style={styles.spacer} />
      <Button title="Request authorization" onPress={handleRequestAuthorization} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  text: {
    fontSize: 16,
  },
  error: {
    fontSize: 16,
  },
  spacer: {
    height: 12,
  },
});
