import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, fontSize } from '../constants/theme';

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '', phone: '',
    businessName: '', businessAddress: '', cuisineType: '', latitude: '', longitude: '',
  });

  const update = (key: string, v: string) => setForm({ ...form, [key]: v });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (isRegister) {
        const { email, password, firstName, lastName, phone, businessName, businessAddress, cuisineType, latitude, longitude } = form;
        if (!email || !password || !firstName || !businessName || !businessAddress || !cuisineType) {
          Alert.alert('Error', 'Please fill in all required fields'); setLoading(false); return;
        }
        await register({
          email, password, firstName, lastName, phone,
          businessName, businessAddress, cuisineType,
          latitude: latitude ? parseFloat(latitude) : 6.4489,
          longitude: longitude ? parseFloat(longitude) : 3.4357,
        });
      } else {
        await login(form.email, form.password);
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'An error occurred');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
        <Text style={styles.logo}>TFood</Text>
        <Text style={styles.subtitle}>Vendor Partner</Text>
        <Text style={styles.title}>{isRegister ? 'Register Your Business' : 'Sign In'}</Text>

        {!isRegister ? (
          <>
            <TextInput style={styles.input} placeholder="Email" value={form.email} onChangeText={(v) => update('email', v)} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Password" value={form.password} onChangeText={(v) => update('password', v)} secureTextEntry />
            <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsRegister(true)}><Text style={styles.switchText}>New vendor? Register here</Text></TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.row}>
              <View style={{ flex: 1 }}><TextInput style={styles.input} placeholder="First Name*" value={form.firstName} onChangeText={(v) => update('firstName', v)} /></View>
              <View style={{ width: spacing.sm }} />
              <View style={{ flex: 1 }}><TextInput style={styles.input} placeholder="Last Name" value={form.lastName} onChangeText={(v) => update('lastName', v)} /></View>
            </View>
            <TextInput style={styles.input} placeholder="Email*" value={form.email} onChangeText={(v) => update('email', v)} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Phone" value={form.phone} onChangeText={(v) => update('phone', v)} keyboardType="phone-pad" />
            <TextInput style={styles.input} placeholder="Password* (min 8 chars)" value={form.password} onChangeText={(v) => update('password', v)} secureTextEntry />
            <TextInput style={styles.input} placeholder="Business Name*" value={form.businessName} onChangeText={(v) => update('businessName', v)} />
            <TextInput style={styles.input} placeholder="Business Address*" value={form.businessAddress} onChangeText={(v) => update('businessAddress', v)} />
            <TextInput style={styles.input} placeholder="Cuisine Type* (e.g., Nigerian, Chinese)" value={form.cuisineType} onChangeText={(v) => update('cuisineType', v)} />
            <View style={styles.row}>
              <View style={{ flex: 1 }}><TextInput style={styles.input} placeholder="Latitude" value={form.latitude} onChangeText={(v) => update('latitude', v)} keyboardType="numeric" /></View>
              <View style={{ width: spacing.sm }} />
              <View style={{ flex: 1 }}><TextInput style={styles.input} placeholder="Longitude" value={form.longitude} onChangeText={(v) => update('longitude', v)} keyboardType="numeric" /></View>
            </View>
            <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register Your Business</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsRegister(false)}><Text style={styles.switchText}>Already registered? Sign In</Text></TouchableOpacity>
          </>
        )}
        <Text style={styles.note}>After registration, your business will be vetted before going live.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  logo: { fontSize: 40, fontWeight: '800', color: colors.primary, textAlign: 'center' },
  subtitle: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.lg },
  title: { fontSize: fontSize.xl, fontWeight: '600', marginBottom: spacing.md },
  input: { backgroundColor: colors.white, padding: spacing.md, borderRadius: 10, marginBottom: spacing.sm, fontSize: fontSize.md, borderWidth: 1, borderColor: colors.border },
  button: { backgroundColor: colors.primary, padding: spacing.md, borderRadius: 10, alignItems: 'center', marginTop: spacing.sm },
  buttonText: { color: colors.white, fontSize: fontSize.lg, fontWeight: '600' },
  switchText: { textAlign: 'center', marginTop: spacing.md, color: colors.primary, fontWeight: '500' },
  row: { flexDirection: 'row' },
  note: { textAlign: 'center', fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.lg, fontStyle: 'italic' },
});
