import { StyleSheet, Text, View } from 'react-native';

export default function SessionScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Focus Session</Text>
            <Text>This is a placeholder screen for starting and managing a session.</Text>
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