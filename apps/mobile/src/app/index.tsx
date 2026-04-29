import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>tunnel</Text>
      <Text style={styles.subtitle}>iPhone-first focus app learning project</Text>

      <View style={styles.links}>
        <Link href="/onboarding" style={styles.link}>
          Go to Onboarding
        </Link>
        <Link href="/session" style={styles.link}>
          Go to Session
        </Link>
        <Link href="/settings" style={styles.link}>
          Go to Settings
        </Link>
        <Link href="/native-test" style={styles.link}>
          Go to Native Test
        </Link>
        <Link href="/selection-test" style={styles.link}>
          Go to Selection Test
        </Link>
        <Link href="/focus-session" style={styles.link}>
          Go to Focus Session
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
  },
  links: {
    marginTop: 24,
    gap: 12,
  },
  link: {
    fontSize: 18,
  },
});
