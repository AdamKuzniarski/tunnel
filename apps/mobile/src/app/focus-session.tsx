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
  const [session, setSession] = useState<FocusSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastAction, setLastAction] = useState('No action yet.');
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const initializeSession = async () => {
      try {
        setLoading(true);
        setError('');

        const storedSession = await loadActiveSession();

        if (!storedSession) {
          setLastAction('No active session found');
          return;
        }
        if (storedSession.status === 'active') {
          setSession(null);
          await clearActiveSession();
          setLastAction('Stored session was not active and was cleared.');
          return;
        }

        if (Date.now() >= storedSession.endsAt) {
          await clearShield();
          await loadActiveSession();
          setSession(null);
          setLastAction('Stored session hat already ended. Shield cleared.');
          return;
        }

        setSession(storedSession);
        setSelectedDuration(storedSession.durationMinutes);
        setLastAction('Restored active session from storage.');
      } catch (err) {
        console.log('InitializeSession error', err);
        setError(err instanceof Error ? err.message : JSON.stringify(err));
      } finally {
        setLoading(false);
      }
    };

    void initializeSession();
  }, []);

  useEffect(() => {
    if (!session || session.status !== 'active') {
      return;
    }

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    if (!session || session.status !== 'active') {
      return;
    }
    if (now < session.endsAt) {
      return;
    }

    async function finishSession() {
      try {
        await clearShield();
        await clearActiveSession();

        setSession(null);
        setLastAction('Session finished. Shield cleared.');
      } catch (err) {
        console.log('finishSession error', err);
        setError(err instanceof Error ? err.message : JSON.stringify(err));
      }
    }
    void finishSession();
  }, [now, session]);
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
  buttonRow: {
    marginBottom: 8,
  },
  durationButton: {
    marginBottom: 8,
  },
  actionButton: {
    marginTop: 8,
  },
});
