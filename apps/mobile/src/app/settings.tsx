import { StyleSheet, Text } from 'react-native';
import { colors, fontFamilies, typography } from '@/theme';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { AppButton } from '@/components/ui/AppButton';
import { PageHeader } from '@/components/ui/PageHeader';
import { resetOnboardingCompleted } from '@/services/onBoardingStorage';
import { router } from 'expo-router';

export default function SettingsScreen() {
  return (
    <Screen>
      <PageHeader
        eyebrow="Settings"
        title="App settings"
        description="This area will hold app preferences and product options later."
      />

      <Card>
        <Text style={styles.bodyText}>
          tunnel settings are not implemented yet. This screen exists so the app shell already feels
          complete.
        </Text>
      </Card>

      {__DEV__ ? (
        <Card>
          <Text style={styles.devTitle}>Developer</Text>
          <AppButton
            label="Reset onboarding"
            onPress={async () => {
              await resetOnboardingCompleted();
              router.replace('/onboarding');
            }}
            variant="quiet"
          />
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  bodyText: {
    color: colors.muted,
    fontSize: typography.bodySmall,
    lineHeight: 22,
    fontFamily: fontFamilies.sans.regular,
  },
  devTitle: {
    color: colors.mutedForeground,
    fontSize: typography.label,
    fontFamily: fontFamilies.sans.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
