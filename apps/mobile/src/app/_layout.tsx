import { Stack } from 'expo-router';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: 'Back',
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.foreground,
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    />
  );
}
