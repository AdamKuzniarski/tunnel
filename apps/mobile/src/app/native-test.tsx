import {useState} from "react";
import {Button, StyleSheet, Text, View} from "react-native";
import TunnelFocusControlModule from "../../modules/tunnel-focus-control";

export default function NativeTestScreen(){
    const [result, setResult]=useState('no native call yet.')
    const[error, setError]=useState('')

    function handleCallNative(){
        try{
            const message = TunnelFocusControlModule.hello()
            setResult(message)
            setError('')
        }catch (err){
            setError(err instanceof Error ? err.message :'Unknown error')
        }
    };

    return(
        <View style={styles.container}>
            <Text style={styles.title}>Native Test</Text>
            <Text style={styles.text}>Result:{result}</Text>
            {error ? <Text style={styles.error}>Error: {error}</Text> : null}
            <Button title="Call Swift hello()" onPress={handleCallNative} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
        gap: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
    },
    text: {
        fontSize: 16,
    },
    error: {
        fontSize: 16,
    },
});