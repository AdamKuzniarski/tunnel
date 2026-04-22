import { StyleSheet, Text, View } from 'react-native';

export default function OnboardingScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Onboarding</Text>
            <Text>This is a placeholder screen for the onboarding flow.</Text>
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
    },
});