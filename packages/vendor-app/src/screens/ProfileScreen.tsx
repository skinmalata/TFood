import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { vendor as vendorApi } from '../services/api';
import { colors, spacing, fontSize } from '../constants/theme';

export default function ProfileScreen() {
  const { user, vendor, logout, refreshVendor } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    businessName: vendor?.business_name || '',
    description: vendor?.description || '',
    deliveryRadius: vendor?.delivery_radius ? String(vendor.delivery_radius) : '5',
    preparationTime: vendor?.preparation_time ? String(vendor.preparation_time) : '30',
    openingHours: vendor?.opening_hours || '08:00',
    closingHours: vendor?.closing_hours || '22:00',
    bankAccountName: vendor?.bank_account_name || '',
    bankName: vendor?.bank_name || '',
    bankAccountNumber: vendor?.bank_account_number || '',
  });

  const save = async () => {
    try {
      await vendorApi.update(form);
      await refreshVendor();
      Alert.alert('Saved', 'Business profile updated');
      setEditing(false);
    } catch (err: any) { Alert.alert('Error', err.response?.data?.message || 'Failed to save'); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        <Text style={styles.title}>Business Settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Info</Text>
          <TextInput style={styles.input} placeholder="Business Name" value={form.businessName} onChangeText={(v) => setForm({ ...form, businessName: v })} editable={editing} />
          <TextInput style={styles.input} placeholder="Description" value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} editable={editing} multiline />
          <TextInput style={styles.input} placeholder="Delivery Radius (km)" value={form.deliveryRadius} onChangeText={(v) => setForm({ ...form, deliveryRadius: v })} editable={editing} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Preparation Time (min)" value={form.preparationTime} onChangeText={(v) => setForm({ ...form, preparationTime: v })} editable={editing} keyboardType="numeric" />
          <View style={styles.row}>
            <View style={{ flex: 1 }}><TextInput style={styles.input} placeholder="Open (e.g. 08:00)" value={form.openingHours} onChangeText={(v) => setForm({ ...form, openingHours: v })} editable={editing} /></View>
            <View style={{ width: spacing.sm }} />
            <View style={{ flex: 1 }}><TextInput style={styles.input} placeholder="Close (e.g. 22:00)" value={form.closingHours} onChangeText={(v) => setForm({ ...form, closingHours: v })} editable={editing} /></View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bank Details (for payouts)</Text>
          <TextInput style={styles.input} placeholder="Account Name" value={form.bankAccountName} onChangeText={(v) => setForm({ ...form, bankAccountName: v })} editable={editing} />
          <TextInput style={styles.input} placeholder="Bank Name" value={form.bankName} onChangeText={(v) => setForm({ ...form, bankName: v })} editable={editing} />
          <TextInput style={styles.input} placeholder="Account Number" value={form.bankAccountNumber} onChangeText={(v) => setForm({ ...form, bankAccountNumber: v })} editable={editing} keyboardType="numeric" />
        </View>

        <View style={styles.actions}>
          {editing ? (
            <>
              <TouchableOpacity style={styles.saveBtn} onPress={save}><Text style={styles.saveBtnText}>Save Changes</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.textMuted }]} onPress={() => setEditing(false)}><Text style={styles.saveBtnText}>Cancel</Text></TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.saveBtn} onPress={() => setEditing(true)}><Text style={styles.saveBtnText}>Edit Profile</Text></TouchableOpacity>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.infoTitle}>Vendor Status: {vendor?.status}</Text>
          <Text style={styles.infoText}>Account: {user?.email}</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => {
          Alert.alert('Logout', 'Are you sure?', [
            { text: 'Cancel' },
            { text: 'Logout', onPress: logout },
          ]);
        }}>
          <Text style={styles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: fontSize.xxl, fontWeight: '700', marginBottom: spacing.md },
  section: { backgroundColor: colors.white, padding: spacing.md, borderRadius: 12, marginBottom: spacing.md },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '600', marginBottom: spacing.sm },
  input: { backgroundColor: colors.background, padding: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 8, fontSize: fontSize.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  row: { flexDirection: 'row' },
  actions: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  saveBtn: { flex: 1, backgroundColor: colors.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: colors.white, fontWeight: '600' },
  info: { backgroundColor: colors.white, padding: spacing.md, borderRadius: 12, marginBottom: spacing.md },
  infoTitle: { fontSize: fontSize.md, fontWeight: '500' },
  infoText: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 4 },
  logoutBtn: { padding: spacing.md, alignItems: 'center' },
  logoutBtnText: { color: colors.error, fontSize: fontSize.md, fontWeight: '600' },
});
