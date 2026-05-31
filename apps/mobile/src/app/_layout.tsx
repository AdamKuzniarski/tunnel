import { Stack } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { colors } from '@/theme';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppState } from 'react-native';

import { reconcileExpiredActiveSession } from '@/services/sessionExpiry';

export default function RootLayout() {
  const expiryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    void SplashScreen.preventAutoHideAsync().catch(() => {});
  }, []);

  const [fontsLoaded] = useFonts({
    'Geist-Regular': require('../assets/fonts/Geist-Regular.ttf'),
    'Geist-Medium': require('../assets/fonts/Geist-Medium.ttf'),
    'Geist-SemiBold': require('../assets/fonts/Geist-SemiBold.ttf'),
    'GeistMono-Regular': require('../assets/fonts/GeistMono-Regular.ttf'),
    'GeistMono-Medium': require('../assets/fonts/GeistMono-Medium.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    function clearExpiredSession() {
      void reconcileExpiredActiveSession().catch((err) => {
        console.log('reconcileExpiredActiveSession error:', err);
      });
    }

    function stopExpiryChecks() {
      if (expiryIntervalRef.current) {
        clearInterval(expiryIntervalRef.current);
        expiryIntervalRef.current = null;
      }
    }

    function startExpiryChecks() {
      clearExpiredSession();

      if (!expiryIntervalRef.current) {
        expiryIntervalRef.current = setInterval(clearExpiredSession, 5_000);
      }
    }

    clearExpiredSession();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        startExpiryChecks();
        return;
      }

      stopExpiryChecks();
    });

    if (AppState.currentState === 'active') {
      startExpiryChecks();
    }

    return () => {
      subscription.remove();
      stopExpiryChecks();
    };
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      />
    </SafeAreaProvider>
  );
}
