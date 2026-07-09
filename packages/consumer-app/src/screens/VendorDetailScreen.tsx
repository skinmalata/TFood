import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { vendors } from '../services/api';
import { colors, spacing, fontSize } from '../constants/theme';

interface CartItem { menuItemId: number; name: string; price: number; quantity: number; }

export default function VendorDetailScreen({ route, navigation }: any) {
  const { vendorId } = route.params;
  const [vendor, setVendor] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await vendors.getPublic(vendorId);
        setVendor(res.data.data);
        setMenuItems(res.data.data.menuItems || []);
      } catch (err) { Alert.alert('Error', 'Failed to load vendor'); navigation.goBack(); }
      finally { setLoading(false); }
    };
    fetch();
  }, [vendorId]);

  const addToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id);
      if (existing) return prev.map((c) => c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menuItemId: item.id, name: item.name, price: Number(item.price), quantity: 1 }];
    });
  };

  const removeFromCart = (menuItemId: number) => {
    setCart((prev) => {
      const item = prev.find((c) => c.menuItemId === menuItemId);
      if (item && item.quantity > 1) return prev.map((c) => c.menuItemId === menuItemId ? { ...c, quantity: c.quantity - 1 } : c);
      return prev.filter((c) => c.menuItemId !== menuItemId);
    });
  };

  const total = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  const categories = [...new Set(menuItems.map((m: any) => m.category))];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={styles.vendorName}>{vendor?.business_name}</Text>
          <Text style={styles.vendorMeta}>{vendor?.cuisine_type} • ★ {vendor?.rating} • {vendor?.totalOrders} orders</Text>
          {vendor?.is_open ? <Text style={styles.open}>Open</Text> : <Text style={styles.closed}>Closed</Text>}
        </View>
      </View>
      {vendor?.description && <Text style={styles.desc}>{vendor.description}</Text>}
      <FlatList data={categories} renderItem={({ item: cat }) => (
        <View style={{ marginBottom: spacing.md }}>
          <Text style={styles.catTitle}>{cat}</Text>
          {menuItems.filter((m: any) => m.category === cat).map((item: any) => (
            <View key={item.id} style={styles.menuItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDesc}>{item.description}</Text>
                <Text style={styles.itemPrice}>₦{Number(item.price).toLocaleString()}</Text>
              </View>
              {item.is_available ? (
                <View style={{ alignItems: 'center' }}>
                  <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}><Text style={styles.addBtnText}>+</Text></TouchableOpacity>
                  {cart.find((c) => c.menuItemId === item.id) && (
                    <View style={styles.qtyRow}>
                      <TouchableOpacity onPress={() => removeFromCart(item.id)}><Text style={styles.qtyBtn}>-</Text></TouchableOpacity>
                      <Text style={styles.qty}>{cart.find((c) => c.menuItemId === item.id)?.quantity || 0}</Text>
                      <TouchableOpacity onPress={() => addToCart(item)}><Text style={styles.qtyBtn}>+</Text></TouchableOpacity>
                    </View>
                  )}
                </View>
              ) : <Text style={styles.unavailable}>Unavailable</Text>}
            </View>
          ))}
        </View>
      )} keyExtractor={(item) => item} contentContainerStyle={{ padding: spacing.md }} ListFooterComponent={<View style={{ height: 80 }} />} />
      {cart.length > 0 && (
        <View style={styles.cartBar}>
          <View><Text style={styles.cartCount}>{cart.length} item(s)</Text><Text style={styles.cartTotal}>₦{total.toLocaleString()}</Text></View>
          <TouchableOpacity style={styles.orderBtn} onPress={() => navigation.navigate('Checkout', { vendorId: Number(vendorId), vendorName: vendor?.business_name, cart })}>
            <Text style={styles.orderBtnText}>Proceed to Checkout</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { fontSize: fontSize.md, color: colors.primary, fontWeight: '600' },
  vendorName: { fontSize: fontSize.lg, fontWeight: '700' },
  vendorMeta: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  open: { color: colors.success, fontSize: fontSize.xs, fontWeight: '600', marginTop: 2 },
  closed: { color: colors.error, fontSize: fontSize.xs, fontWeight: '600', marginTop: 2 },
  desc: { padding: spacing.md, fontSize: fontSize.sm, color: colors.textLight, backgroundColor: colors.white, marginBottom: 1 },
  catTitle: { fontSize: fontSize.lg, fontWeight: '600', marginBottom: spacing.sm, color: colors.text, marginTop: spacing.sm },
  menuItem: { flexDirection: 'row', backgroundColor: colors.white, padding: spacing.md, borderRadius: 10, marginBottom: spacing.sm, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  itemName: { fontSize: fontSize.md, fontWeight: '500' },
  itemDesc: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  itemPrice: { fontSize: fontSize.md, fontWeight: '600', color: colors.primary, marginTop: 4 },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  addBtnText: { color: colors.white, fontSize: 20, fontWeight: '600', lineHeight: 22 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs, gap: 8 },
  qtyBtn: { fontSize: 18, color: colors.primary, fontWeight: '700', paddingHorizontal: 8 },
  qty: { fontSize: fontSize.md, fontWeight: '600', minWidth: 20, textAlign: 'center' },
  unavailable: { fontSize: fontSize.xs, color: colors.textMuted, fontStyle: 'italic' },
  cartBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.white, padding: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 8 },
  cartCount: { fontSize: fontSize.sm, color: colors.textMuted },
  cartTotal: { fontSize: fontSize.lg, fontWeight: '700', color: colors.primary },
  orderBtn: { backgroundColor: colors.primary, padding: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: 10 },
  orderBtnText: { color: colors.white, fontWeight: '600', fontSize: fontSize.md },
});
