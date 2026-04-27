import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import { TunnelFocusControlView } from '../../modules/tunnel-focus-control';
import { TunnelSelectionSummary } from '../../modules/tunnel-focus-control';
import { clearSelectionSummary, loadSelectionSummary, saveSelectionSummary } from '@/services/selectionStorage';

export default function SelectionTestScreen() {
  const [summary, setSummary] = useState<TunnelSelectionSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastAction, setLastAction] = useState('No action yet.');

  useEffect(() => {
    const initializeSelection = async () => {
      try {
        setLoading(true);
        setError('');

        const storedSummary = await loadSelectionSummary();
        setSummary(storedSummary);

        if (storedSummary) {
          setLastAction('Loaded stored selection summary.');
        } else {
          setLastAction('No stored selection summary found.');
        }
      } catch (err) {
        console.log('loadSelectionSummary error: ', err);
        setError(err instanceof Error ? err.message : JSON.stringify(err));
      } finally {
        setLoading(false);
      }
    };

    void initializeSelection();
  }, []);

  const handleSelectionChange = async (
    nextSummary: TunnelSelectionSummary,
  ) => {
    try {
      setError('');
      setSummary(nextSummary);
      await saveSelectionSummary(nextSummary);
      setLastAction('Updated and stored selection summary.');
    } catch (err) {
      console.log('saveSelectionSummary error', err);
      setError(err instanceof Error ? err.message : JSON.stringify(err));
    }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selection Test</Text>
      <Text style={styles.label}>Has selection</Text>
      <Text style={styles.value}>
        {summary ? String(summary.hasSelection) : 'No selection yet.'}
      </Text>
      <Text style={styles.label}>Selected apps</Text>
      <Text style={styles.value}>{summary?.applicationCount ?? 0}</Text>

      <Text style={styles.label}>Selected web domains</Text>
      <Text style={styles.value}>{summary?.webDomainCount ?? 0}</Text>

      <View style={styles.pickerContainer}>
        <TunnelFocusControlView
          style={styles.picker}
          onSelectionChange={(event) => {
            setSummary(event.nativeEvent);
          }}
        />
      </View>
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
  pickerContainer: {
    flex: 1,
    minHeight: 400,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    flex: 1,
  },
});
