import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { getAuthorizationStatus } from '../services/focusControl';

export default function NativeTestScreen() {
  const [result, setResult] = useState('No native call yet.');
  const [error, setError] = useState('');

  const handleGetAuthorizationStatus = async () => {
    try {
      const status = await getAuthorizationStatus();
      setResult(`Authorization status: ${status}`);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Native Test</Text>
      <Text style={styles.text}>{result}</Text>
      {error ? <Text style={styles.error}>Error: {error}</Text> : null}
      <Button title="Get authorization status" onPress={handleGetAuthorizationStatus} />
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
});
