import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { orders as ordersApi } from '../services/api';
import { colors, spacing, fontSize } from '../constants/theme';

export default function CheckoutScreen({ route, navigation }: any) {
  const { vendorId, vendorName, cart } = route.params;
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const total = cart.reduce((sum: number, c: any) => sum + c.price * c.quantity, 0);

  const placeOrder = async () => {
    if (deliveryMethod === 'delivery' && !deliveryAddress) {
      Alert.alert('Error', 'Delivery address is required'); return;
    }
    setLoading(true);
    try {
      const res = await ordersApi.create({
        vendorId,
        items: cart.map((c: any) => ({ menuItemId: c.menuItemId, quantity: c.quantity })),
        deliveryMethod,
        deliveryAddress: deliveryAddress || undefined,
        notes: notes || undefined,
      });
      const { order, paymentUrl } = res.data.data;
      if (paymentUrl) {
        // In production, open Paystack WebView
        Alert.alert('Order Placed!', `Order #${order.order_number} created. Complete payment to confirm.`);
      } else {
        Alert.alert('Order Placed!', `Order #${order.order_number} has been sent to ${vendorName}.`);
      }
      navigation.navigate('Orders');
    } catch (err: any) {
      Alert.alert('Order Failed', err.response?.data?.message || 'An error occurred');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        <Text style={styles.title}>Checkout</Text>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>From: {vendorName}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {cart.map((c: any, i: number) => (
            <View key={i} style={styles.itemRow}>
              <Text style={{ flex: 1 }}>{c.name} x{c.quantity}</Text>
              <Text style={styles.itemTotal}>₦{(c.price * c.quantity).toLocaleString()}</Text>
            </View>
          ))}
          <View style={[styles.itemRow, { borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.sm, paddingTop: spacing.sm }]}>
            <Text style={{ fontWeight: '700' }}>Total</Text>
            <Text style={[styles.itemTotal, { fontWeight: '700', color: colors.primary }]}>₦{total.toLocaleString()}</Text>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Method</Text>
          <View style={styles.methodRow}>
            <TouchableOpacity onPress={() => setDeliveryMethod('pickup')} style={[styles.methodBtn, deliveryMethod === 'pickup' && styles.methodActive]}>
              <Text style={[styles.methodText, deliveryMethod === 'pickup' && { color: colors.primary }]}>Pickup</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setDeliveryMethod('delivery')} style={[styles.methodBtn, deliveryMethod === 'delivery' && styles.methodActive]}>
              <Text style={[styles.methodText, deliveryMethod === 'delivery' && { color: colors.primary }]}>Delivery</Text>
            </TouchableOpacity>
          </View>
          {deliveryMethod === 'delivery' && (
            <TextInput style={styles.input} placeholder="Enter your delivery address" value={deliveryAddress} onChangeText={setDeliveryAddress} multiline />
          )}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Notes (optional)</Text>
          <TextInput style={styles.input} placeholder="Any special instructions?" value={notes} onChangeText={setNotes} multiline />
        </View>
        <TouchableOpacity style={styles.placeOrderBtn} onPress={placeOrder} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.placeOrderText}>Place Order • ₦{total.toLocaleString()}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: fontSize.xxl, fontWeight: '700', marginBottom: spacing.lg },
  section: { backgroundColor: colors.white, padding: spacing.md, borderRadius: 12, marginBottom: spacing.md },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '600', marginBottom: spacing.sm },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  itemTotal: { fontWeight: '500', color: colors.text },
  methodRow: { flexDirection: 'row', gap: 8 },
  methodBtn: { padding: 10, paddingHorizontal: 20, borderRadius: 8, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  methodActive: { borderColor: colors.primary, backgroundColor: colors.white },
  methodText: { fontSize: fontSize.sm, fontWeight: '500' },
  input: { backgroundColor: colors.background, padding: spacing.md, borderRadius: 8, marginTop: spacing.sm, fontSize: fontSize.md, borderWidth: 1, borderColor: colors.border },
  placeOrderBtn: { backgroundColor: colors.primary, padding: spacing.md, borderRadius: 12, alignItems: 'center', marginTop: spacing.md },
  placeOrderText: { color: colors.white, fontSize: fontSize.lg, fontWeight: '700' },
});
