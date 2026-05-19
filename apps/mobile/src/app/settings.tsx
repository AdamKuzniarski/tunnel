import { StyleSheet, Text } from 'react-native';
import { colors, fontFamilies, typography } from '@/theme';
import { Screen } from '@/components/ui/Screen';
import { Section } from '@/components/ui/Section';
import { AppButton } from '@/components/ui/AppButton';
import { resetOnboardingCompleted } from '@/services/onBoardingStorage';
import { router } from 'expo-router';

export default function SettingsScreen() {
  return (
    <Screen>
      <Section
        eyebrow="Settings"
        title="App settings"
        description="This area will hold app preferences and product options later."
      />

      <Section bordered eyebrow="Current state" title="Placeholder">
        <Text style={styles.bodyText}>
          tunnel settings are not implemented yet. This screen exists so the app shell already feels
          complete.
        </Text>
      </Section>

      {__DEV__ ? (
        <Section bordered eyebrow="Developer" title="Debug tools">
          <AppButton
            label="Reset onboarding"
            onPress={async () => {
              await resetOnboardingCompleted();
              router.replace('/onboarding');
            }}
            variant="quiet"
          />
        </Section>
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
});
