import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { applyShield, clearShield } from '@/services/focusControl';
import {
  clearActiveSession,
  loadActiveSession,
  saveActiveSession,
} from '@/services/sessionStorage';
import type { FocusSession, FocusSessionDurationMinutes } from '@/types/session';
import { appendSessionHistoryEntry } from '@/services/sessionHistoryStorage';

const DURATION_OPTIONS: FocusSessionDurationMinutes[] = [30, 60, 90];

export default function FocusSessionScreen() {
  const [selectedDuration, setSelectedDuration] = useState<FocusSessionDurationMinutes>(30);
  const [session, setSession] = useState<FocusSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastAction, setLastAction] = useState('No action yet.');
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  const [unlockStep, setUnlockStep] = useState<'idle' | 'armed' | 'countdown'>('idle');
  const [unlockCountdown, setUnlockCountdown] = useState(0);
  const isFinishingSessionRef = useRef(false);

  const isSessionActive = session?.status === 'active';

  function resetUnlockFlow() {
    setUnlockStep('idle');
    setUnlockCountdown(0);
  }

  function handleArmEmergencyUnlock() {
    setError('');
    setUnlockStep('armed');
    setLastAction('Emergency unlock armed. Confirm to start the delay.');
  }

  function handleStartEmergencyUnlockCountdown() {
    setError('');
    setUnlockStep('countdown');
    setUnlockCountdown(10);
    setLastAction('Emergency unlock countdown started.');
  }

  function handleCancelEmergencyUnlock() {
    resetUnlockFlow();
    setLastAction('Emergency unlock cancelled.');
  }

  useEffect(() => {
    const initializeSession = async () => {
      try {
        setLoading(true);
        setError('');

        const storedSession = await loadActiveSession();

        if (!storedSession) {
          setLastAction('No active session found.');
          return;
        }

        if (storedSession.status !== 'active') {
          setSession(null);
          await clearActiveSession();
          setLastAction('Stored session was not active and was cleared.');
          return;
        }

        if (Date.now() >= storedSession.endsAt) {
          await clearShield();
          await clearActiveSession();
          setSession(null);
          resetUnlockFlow();
          setLastAction('Stored session had already ended. Shield cleared.');
          return;
        }

        setSession(storedSession);
        setSelectedDuration(storedSession.durationMinutes);
        setLastAction('Restored active session from storage.');
      } catch (err) {
        console.log('initializeSession error', err);
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

    if (isFinishingSessionRef.current) {
      return;
    }

    isFinishingSessionRef.current = true;
    const sessionToFinish = session;

    const finishSession = async () => {
      try {
        await clearShield();
        await clearActiveSession();

        await appendSessionHistoryEntry({
          id: `${sessionToFinish.id}-completed`,
          startedAt: sessionToFinish.startedAt,
          endedAt: Date.now(),
          durationMinutes: sessionToFinish.durationMinutes,
          outcome: 'completed',
        });

        setSession(null);
        resetUnlockFlow();
        setLastAction('Session finished. Shield cleared.');
      } catch (err) {
        console.log('finishSession error', err);
        setError(err instanceof Error ? err.message : JSON.stringify(err));
      } finally {
        isFinishingSessionRef.current = false;
      }
    };

    void finishSession();
  }, [now, session]);

  useEffect(() => {
    if (unlockStep !== 'countdown' || unlockCountdown <= 0) {
      return;
    }

    const timeout = setTimeout(() => {
      setUnlockCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [unlockStep, unlockCountdown]);

  useEffect(() => {
    if (unlockStep !== 'countdown' || unlockCountdown !== 0) {
      return;
    }

    if (!session || session.status !== 'active') {
      return;
    }

    async function performEmergencyUnlock() {
      try {
        setLoading(true);
        setError('');

        const result = await clearShield();
        await clearActiveSession();
        await appendSessionHistoryEntry({
          id: `${session.id}-emergency-unlock`,
          startedAt: session.startedAt,
          endedAt: Date.now(),
          durationMinutes: session.durationMinutes,
          outcome: 'emergency_unlock',
        });

        setSession(null);
        resetUnlockFlow();
        setLastAction(`Emergency unlock performed. Clear shield result: ${result}`);
      } catch (err) {
        console.log('performEmergencyUnlock error', err);
        setError(err instanceof Error ? err.message : JSON.stringify(err));
      } finally {
        setLoading(false);
      }
    }

    void performEmergencyUnlock();
  }, [session, unlockStep, unlockCountdown]);

  const remainingMs = useMemo(() => {
    if (!session || session.status !== 'active') {
      return 0;
    }

    return Math.max(session.endsAt - now, 0);
  }, [now, session]);

  const remainingText = useMemo(() => {
    const totalSeconds = Math.floor(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [remainingMs]);

  async function handleStartSession() {
    try {
      setLoading(true);
      setError('');
      resetUnlockFlow();

      const shieldResult = await applyShield();

      if (shieldResult !== 'applied') {
        setLastAction(`Shield result: ${shieldResult}`);
        return;
      }

      const startedAt = Date.now();
      const nextSession: FocusSession = {
        id: String(startedAt),
        durationMinutes: selectedDuration,
        startedAt,
        endsAt: startedAt + selectedDuration * 60 * 1000,
        status: 'active',
      };

      await saveActiveSession(nextSession);
      setSession(nextSession);
      setNow(Date.now());
      setLastAction(`Started ${selectedDuration} minute session.`);
    } catch (err) {
      console.log('handleStartSession error', err);
      setError(err instanceof Error ? err.message : JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Focus Session</Text>

      <Text style={styles.label}>Selected duration</Text>
      <View style={styles.buttonRow}>
        {DURATION_OPTIONS.map((duration) => (
          <View key={duration} style={styles.durationButton}>
            <Button
              title={`${duration} min`}
              onPress={() => setSelectedDuration(duration)}
              disabled={isSessionActive || loading}
            />
          </View>
        ))}
      </View>

      <Text style={styles.label}>Current state</Text>
      <Text style={styles.value}>
        {isSessionActive ? 'Active session running' : 'No active session'}
      </Text>

      <Text style={styles.label}>Countdown</Text>
      <Text style={styles.value}>{isSessionActive ? remainingText : '--:--'}</Text>

      <Text style={styles.label}>Last action</Text>
      <Text style={styles.value}>{lastAction}</Text>

      {loading ? <Text style={styles.info}>Working...</Text> : null}
      {error ? <Text style={styles.error}>Error: {error}</Text> : null}

      <View style={styles.actionButton}>
        <Button
          title="Start session"
          onPress={handleStartSession}
          disabled={isSessionActive || loading}
        />
      </View>

      {isSessionActive ? (
        <View style={styles.actionButton}>
          {unlockStep === 'idle' ? (
            <Button
              title="Emergency unlock"
              onPress={handleArmEmergencyUnlock}
              disabled={loading}
            />
          ) : null}

          {unlockStep === 'armed' ? (
            <View style={styles.unlockPanel}>
              <Text style={styles.warningText}>
                Emergency unlock will clear the shield and end the session.
              </Text>

              <View style={styles.actionButton}>
                <Button
                  title="Start 10-second unlock delay"
                  onPress={handleStartEmergencyUnlockCountdown}
                  disabled={loading}
                />
              </View>

              <View style={styles.actionButton}>
                <Button title="Cancel" onPress={handleCancelEmergencyUnlock} disabled={loading} />
              </View>
            </View>
          ) : null}

          {unlockStep === 'countdown' ? (
            <View style={styles.unlockPanel}>
              <Text style={styles.warningText}>
                Emergency unlock in {unlockCountdown} second
                {unlockCountdown === 1 ? '' : 's'}...
              </Text>

              <View style={styles.actionButton}>
                <Button
                  title="Cancel unlock"
                  onPress={handleCancelEmergencyUnlock}
                  disabled={loading}
                />
              </View>
            </View>
          ) : null}
        </View>
      ) : null}
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
  buttonRow: {
    marginBottom: 8,
  },
  durationButton: {
    marginBottom: 8,
  },
  actionButton: {
    marginTop: 8,
  },
  unlockPanel: {
    marginTop: 12,
    gap: 8,
  },
  warningText: {
    fontSize: 16,
  },
});
