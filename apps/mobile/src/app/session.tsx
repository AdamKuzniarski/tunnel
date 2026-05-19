import { StyleSheet, Text } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Section } from '@/components/ui/Section';
import { colors, fontFamilies, typography } from '@/theme';

export default function SessionScreen() {
  return (
    <Screen>
      <Section
        eyebrow="Session"
        title="Focus session"
        description="Start and manage a focus session from this screen."
      />

      <Section bordered eyebrow="State" title="Placeholder">
        <Text style={styles.bodyText}>This route is reserved for future session controls.</Text>
      </Section>
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
