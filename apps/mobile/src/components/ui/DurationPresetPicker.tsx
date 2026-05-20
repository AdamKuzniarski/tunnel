import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontFamilies, radius, spacing, typography } from '@/theme';
import type { FocusSessionDurationMinutes } from '@/types/session';

const DURATION_OPTIONS: FocusSessionDurationMinutes[] = [30, 60, 90];

type DurationPresetPickerProps = {
  value: FocusSessionDurationMinutes;
  onChange: (duration: FocusSessionDurationMinutes) => void;
  disabled?: boolean;
};

export function DurationPresetPicker({
  value,
  onChange,
  disabled = false,
}: DurationPresetPickerProps) {
  return (
    <View style={styles.row}>
      {DURATION_OPTIONS.map((duration) => {
        const selected = value === duration;

        return (
          <Pressable
            key={duration}
            onPress={() => onChange(duration)}
            disabled={disabled}
            style={({ pressed }) => [
              styles.segment,
              selected && styles.segmentSelected,
              disabled && styles.segmentDisabled,
              pressed && !disabled && styles.segmentPressed,
            ]}
          >
            <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
              {duration} min
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  segment: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  segmentSelected: {
    backgroundColor: colors.foreground,
  },
  segmentDisabled: {
    opacity: 0.5,
  },
  segmentPressed: {
    opacity: 0.85,
  },
  segmentText: {
    color: colors.muted,
    fontSize: typography.bodySmall,
    fontFamily: fontFamilies.sans.semibold,
  },
  segmentTextSelected: {
    color: colors.background,
  },
});
