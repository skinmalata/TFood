import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, fontSize } from '../constants/theme';

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Please fill in all fields'); return; }
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      Alert.alert('Login Failed', err.response?.data?.message || 'An error occurred');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.logo}>TFood</Text>
        <Text style={styles.tagline}>Discover food near you</Text>
      </View>
      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.link}>
          <Text style={styles.linkText}>Don't have an account? <Text style={{ fontWeight: '700' }}>Sign Up</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.secondary },
  header: { flex: 0.4, justifyContent: 'center', alignItems: 'center' },
  logo: { fontSize: 48, fontWeight: '800', color: colors.primary },
  tagline: { fontSize: fontSize.md, color: colors.textMuted, marginTop: spacing.sm },
  form: { flex: 0.6, backgroundColor: colors.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: spacing.xl },
  input: { backgroundColor: colors.white, padding: spacing.md, borderRadius: 12, marginBottom: spacing.md, fontSize: fontSize.md, borderWidth: 1, borderColor: colors.border },
  button: { backgroundColor: colors.primary, padding: spacing.md, borderRadius: 12, alignItems: 'center', marginTop: spacing.sm },
  buttonText: { color: colors.white, fontSize: fontSize.lg, fontWeight: '600' },
  link: { alignItems: 'center', marginTop: spacing.lg },
  linkText: { color: colors.textLight, fontSize: fontSize.sm },
});
