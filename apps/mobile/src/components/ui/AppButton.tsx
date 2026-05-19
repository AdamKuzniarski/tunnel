import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fontFamilies, radius, spacing, typography } from '@/theme';

type AppButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
};

export function AppButton({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
}: AppButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'quiet' && styles.quiet,
        variant === 'danger' && styles.danger,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.text,
          (variant === 'secondary' || variant === 'quiet' || variant === 'danger') &&
            styles.textLight,
          variant === 'quiet' && styles.textQuiet,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  primary: {
    backgroundColor: colors.foreground,
    borderColor: colors.foreground,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  quiet: {
    backgroundColor: 'transparent',
    borderColor: colors.borderSubtle,
  },
  danger: {
    backgroundColor: colors.surface,
    borderColor: colors.danger,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.8,
  },
  text: {
    color: colors.background,
    fontSize: typography.button,
    fontFamily: fontFamilies.sans.semibold,
  },
  textQuiet: {
    fontFamily: fontFamilies.sans.medium,
  },
  textLight: {
    color: colors.foreground,
  },
});
