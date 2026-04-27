import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TunnelFocusControlView } from '../../modules/tunnel-focus-control';
import { TunnelSelectionSummary } from '../../modules/tunnel-focus-control';

export default function SelectionTestScreen() {
  const [summary, setSummary] = useState<TunnelSelectionSummary | null>(null);

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
