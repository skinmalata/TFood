import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { menu as menuApi } from '../services/api';
import { colors, spacing, fontSize } from '../constants/theme';

export default function MenuScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', category: '', preparationTime: '' });

  const fetch = async () => {
    try {
      const res = await menuApi.list();
      setItems(res.data.data || []);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const resetForm = () => {
    setForm({ name: '', description: '', price: '', category: '', preparationTime: '' });
    setEditItem(null);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({ name: item.name, description: item.description || '', price: String(item.price), category: item.category, preparationTime: item.preparation_time ? String(item.preparation_time) : '' });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.name || !form.price) { Alert.alert('Error', 'Name and price are required'); return; }
    try {
      const data = { ...form, price: parseFloat(form.price), preparationTime: form.preparationTime ? parseInt(form.preparationTime) : undefined };
      if (editItem) await menuApi.update(editItem.id, data);
      else await menuApi.create(data);
      setShowModal(false);
      resetForm();
      fetch();
    } catch (err: any) { Alert.alert('Error', err.response?.data?.message); }
  };

  const toggleItem = async (id: number) => {
    await menuApi.toggle(id);
    fetch();
  };

  const deleteItem = (id: number) => {
    Alert.alert('Delete Item', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Delete', onPress: async () => { await menuApi.delete(id); fetch(); } },
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Menu ({items.length})</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => { resetForm(); setShowModal(true); }}>
          <Text style={styles.addBtnText}>+ Add Item</Text>
        </TouchableOpacity>
      </View>

      <FlatList data={items} renderItem={({ item }) => (
        <View style={styles.itemCard}>
          <View style={{ flex: 1 }}>
            <View style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>₦{Number(item.price).toLocaleString()}</Text>
            </View>
            <Text style={styles.itemCat}>{item.category}</Text>
          </View>
          <View style={styles.itemActions}>
            <TouchableOpacity style={[styles.badgeBtn, item.is_available ? { backgroundColor: colors.success } : { backgroundColor: colors.textMuted }]} onPress={() => toggleItem(item.id)}>
              <Text style={styles.badgeBtnText}>{item.is_available ? 'Avail' : 'Unavail'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.badgeBtn, { backgroundColor: colors.info }]} onPress={() => openEdit(item)}>
              <Text style={styles.badgeBtnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.badgeBtn, { backgroundColor: colors.error }]} onPress={() => deleteItem(item.id)}>
              <Text style={styles.badgeBtnText}>Del</Text>
            </TouchableOpacity>
          </View>
        </View>
      )} keyExtractor={(item) => String(item.id)} contentContainerStyle={{ padding: spacing.md }} />

      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{editItem ? 'Edit Item' : 'New Menu Item'}</Text>
            <TextInput style={styles.input} placeholder="Name*" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
            <TextInput style={styles.input} placeholder="Description" value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} multiline />
            <TextInput style={styles.input} placeholder="Price (NGN)*" value={form.price} onChangeText={(v) => setForm({ ...form, price: v })} keyboardType="numeric" />
            <TextInput style={styles.input} placeholder="Category (e.g., Main Course)" value={form.category} onChangeText={(v) => setForm({ ...form, category: v })} />
            <TextInput style={styles.input} placeholder="Prep Time (min)" value={form.preparationTime} onChangeText={(v) => setForm({ ...form, preparationTime: v })} keyboardType="numeric" />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={save}><Text style={styles.modalBtnText}>Save</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.textMuted }]} onPress={() => { setShowModal(false); resetForm(); }}><Text style={styles.modalBtnText}>Cancel</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  title: { fontSize: fontSize.xxl, fontWeight: '700' },
  addBtn: { backgroundColor: colors.primary, padding: 8, paddingHorizontal: 16, borderRadius: 8 },
  addBtnText: { color: colors.white, fontWeight: '600', fontSize: fontSize.sm },
  itemCard: { backgroundColor: colors.white, padding: spacing.md, borderRadius: 10, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between' },
  itemName: { fontSize: fontSize.md, fontWeight: '500' },
  itemPrice: { fontWeight: '600', color: colors.primary },
  itemCat: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  itemActions: { flexDirection: 'row', gap: 4, marginLeft: spacing.sm },
  badgeBtn: { padding: 4, paddingHorizontal: 8, borderRadius: 4 },
  badgeBtnText: { color: colors.white, fontSize: 10, fontWeight: '600' },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: spacing.xl },
  modal: { backgroundColor: colors.white, padding: spacing.lg, borderRadius: 16 },
  modalTitle: { fontSize: fontSize.xl, fontWeight: '600', marginBottom: spacing.md },
  input: { backgroundColor: colors.background, padding: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 8, fontSize: fontSize.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  modalBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  modalBtnText: { color: colors.white, fontWeight: '600' },
});
