import { StyleSheet, Text } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { colors, fontFamilies, typography } from '@/theme';

export default function SessionScreen() {
  return (
    <Screen>
      <PageHeader
        eyebrow="Session"
        title="Focus session"
        description="Start and manage a focus session from this screen."
      />

      <Card>
        <Text style={styles.bodyText}>This route is reserved for future session controls.</Text>
      </Card>
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
