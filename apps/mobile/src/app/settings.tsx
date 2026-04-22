import { StyleSheet, Text, View } from 'react-native';

export default function SettingsScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Settings</Text>
            <Text>This is a placeholder screen for app settings.</Text>
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