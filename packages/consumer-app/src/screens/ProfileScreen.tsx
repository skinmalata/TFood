import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, fontSize } from '../constants/theme';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName || user?.first_name || '',
    lastName: user?.lastName || user?.last_name || '',
    phone: user?.phone || '',
    defaultAddress: user?.profile?.default_address || '',
  });

  const saveProfile = async () => {
    try {
      const { auth } = require('../services/api');
      await auth.updateProfile(form);
      updateUser(form);
      Alert.alert('Saved', 'Profile updated successfully');
      setEditing(false);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{form.firstName?.charAt(0) || 'U'}</Text>
          </View>
          <Text style={styles.name}>{form.firstName} {form.lastName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <TextInput style={styles.input} placeholder="First Name" value={form.firstName} onChangeText={(v) => setForm({ ...form, firstName: v })} editable={editing} />
          <TextInput style={styles.input} placeholder="Last Name" value={form.lastName} onChangeText={(v) => setForm({ ...form, lastName: v })} editable={editing} />
          <TextInput style={styles.input} placeholder="Phone" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} editable={editing} keyboardType="phone-pad" />
          <TextInput style={styles.input} placeholder="Default Address" value={form.defaultAddress} onChangeText={(v) => setForm({ ...form, defaultAddress: v })} editable={editing} multiline />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.sm }}>
            {editing ? (
              <>
                <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}><Text style={styles.saveBtnText}>Save</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.textMuted }]} onPress={() => setEditing(false)}><Text style={styles.saveBtnText}>Cancel</Text></TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.saveBtn} onPress={() => setEditing(true)}><Text style={styles.saveBtnText}>Edit Profile</Text></TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
            <Text>Saved Cards</Text>
            <Text style={{ color: colors.textMuted }}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
            <Text>Payment History</Text>
            <Text style={{ color: colors.textMuted }}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
            <Text>Support</Text>
            <Text style={{ color: colors.textMuted }}>→</Text>
          </TouchableOpacity>
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
  header: { alignItems: 'center', padding: spacing.xl },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
  avatarText: { color: colors.white, fontSize: fontSize.xxl, fontWeight: '700' },
  name: { fontSize: fontSize.xl, fontWeight: '600' },
  email: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  section: { backgroundColor: colors.white, padding: spacing.md, borderRadius: 12, marginBottom: spacing.md },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '600', marginBottom: spacing.sm },
  input: { backgroundColor: colors.background, padding: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 8, fontSize: fontSize.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  saveBtn: { backgroundColor: colors.primary, padding: 10, paddingHorizontal: 20, borderRadius: 8 },
  saveBtnText: { color: colors.white, fontWeight: '500' },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  logoutBtn: { padding: spacing.md, alignItems: 'center', marginTop: spacing.md },
  logoutBtnText: { color: colors.error, fontSize: fontSize.md, fontWeight: '600' },
});
