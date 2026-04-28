import { useEffect, useMemo, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { applyShield, clearShield } from '@/services/focusControl';
import {
  clearActiveSession,
  loadActiveSession,
  saveActiveSession,
} from '@/services/selectionStorage';
import type { FocusSession, FocusSessionDurationMinutes } from '@/types/session';

const DURATION_OPTIONS: FocusSessionDurationMinutes[] = [30, 60, 90];

export default function FocusSessionScreen() {
  const [selectedDuration, setSelectedDuration] = useState<FocusSessionDurationMinutes>(30);
}

const styles = {
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
  buttonRow: {
    marginBottom: 8,
  },
  durationButton: {
    marginBottom: 8,
  },
  actionButton: {
    marginTop: 8,
  },
};
