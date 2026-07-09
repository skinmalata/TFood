import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, fontSize } from '../constants/theme';

export default function RegisterScreen({ navigation }: any) {
  const { register } = useAuth();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const update = (key: string, value: string) => setForm({ ...form, [key]: value });

  const handleRegister = async () => {
    const { firstName, lastName, email, phone, password, confirmPassword } = form;
    if (!firstName || !lastName || !email || !phone || !password) { Alert.alert('Error', 'Please fill in all fields'); return; }
    if (password !== confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return; }

    setLoading(true);
    try {
      await register({ ...form, role: 'consumer' });
    } catch (err: any) {
      Alert.alert('Registration Failed', err.response?.data?.message || 'An error occurred');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: spacing.xl }}>
        <Text style={styles.title}>Create Account</Text>
        <View style={styles.row}>
          <View style={{ flex: 1 }}><TextInput style={styles.input} placeholder="First Name" value={form.firstName} onChangeText={(v) => update('firstName', v)} /></View>
          <View style={{ width: spacing.md }} />
          <View style={{ flex: 1 }}><TextInput style={styles.input} placeholder="Last Name" value={form.lastName} onChangeText={(v) => update('lastName', v)} /></View>
        </View>
        <TextInput style={styles.input} placeholder="Email" value={form.email} onChangeText={(v) => update('email', v)} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Phone (e.g. +2348012345678)" value={form.phone} onChangeText={(v) => update('phone', v)} keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder="Password (min 8 chars)" value={form.password} onChangeText={(v) => update('password', v)} secureTextEntry />
        <TextInput style={styles.input} placeholder="Confirm Password" value={form.confirmPassword} onChangeText={(v) => update('confirmPassword', v)} secureTextEntry />
        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.link}>
          <Text style={styles.linkText}>Already have an account? <Text style={{ fontWeight: '700' }}>Sign In</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  title: { fontSize: fontSize.xxl, fontWeight: '700', marginBottom: spacing.xl, color: colors.text },
  row: { flexDirection: 'row' },
  input: { backgroundColor: colors.white, padding: spacing.md, borderRadius: 12, marginBottom: spacing.md, fontSize: fontSize.md, borderWidth: 1, borderColor: colors.border },
  button: { backgroundColor: colors.primary, padding: spacing.md, borderRadius: 12, alignItems: 'center', marginTop: spacing.sm },
  buttonText: { color: colors.white, fontSize: fontSize.lg, fontWeight: '600' },
  link: { alignItems: 'center', marginTop: spacing.lg },
  linkText: { color: colors.textLight, fontSize: fontSize.sm },
});
