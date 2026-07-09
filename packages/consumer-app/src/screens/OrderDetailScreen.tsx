import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { orders as ordersApi, reviews as reviewsApi } from '../services/api';
import { colors, spacing, fontSize } from '../constants/theme';

export default function OrderDetailScreen({ route, navigation }: any) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    ordersApi.get(orderId).then((res) => setOrder(res.data.data)).catch(() => Alert.alert('Error', 'Failed to load order'))
      .finally(() => setLoading(false));
  }, [orderId]);

  const submitReview = async () => {
    try {
      await reviewsApi.create({ orderId, rating, comment });
      Alert.alert('Thank you!', 'Your review has been submitted.');
      setShowReview(false);
    } catch (err: any) { Alert.alert('Error', err.response?.data?.message || 'Failed to submit review'); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  if (!order) return <View style={styles.center}><Text>Order not found</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
      <Text style={styles.orderNum}>Order #{order.order_number}</Text>
      <View style={styles.statusRow}>
        <Text style={[styles.status, { color: order.status === 'delivered' ? colors.success : colors.primary }]}>{order.status?.replace(/_/g, ' ')}</Text>
        <Text style={styles.paymentStatus}>Payment: {order.payment_status}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items</Text>
        {order.items?.map((item: any, i: number) => (
          <View key={i} style={styles.itemRow}>
            <Text style={{ flex: 1 }}>{item.name} x{item.quantity}</Text>
            <Text>₦{Number(item.subtotal).toLocaleString()}</Text>
          </View>
        ))}
        <View style={[styles.itemRow, { borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.sm, paddingTop: spacing.sm }]}>
          <Text>Delivery Fee</Text><Text>₦{Number(order.delivery_fee || 0).toLocaleString()}</Text>
        </View>
        <View style={[styles.itemRow, { marginTop: spacing.xs }]}>
          <Text style={{ fontWeight: '700', fontSize: fontSize.md }}>Total</Text>
          <Text style={{ fontWeight: '700', color: colors.primary, fontSize: fontSize.lg }}>₦{Number(order.total_amount).toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Chat', { orderId: order.id, vendorName: order.business_name })}>
            <Text style={styles.actionBtnText}>💬 Chat</Text>
          </TouchableOpacity>
          {order.status === 'pending' && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.error }]} onPress={() => {
              Alert.alert('Cancel Order?', 'Are you sure?', [
                { text: 'No' },
                { text: 'Yes', onPress: async () => { await ordersApi.cancel(order.id); setOrder({ ...order, status: 'cancelled' }); } },
              ]);
            }}>
              <Text style={styles.actionBtnText}>Cancel Order</Text>
            </TouchableOpacity>
          )}
          {order.status === 'delivered' && !order.reviews && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.success }]} onPress={() => setShowReview(true)}>
              <Text style={styles.actionBtnText}>★ Rate Order</Text>
            </TouchableOpacity>
          )}
          {(order.status === 'delivered' || order.status === 'accepted' || order.status === 'preparing') && !order.disputes && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.warning }]} onPress={() => navigation.navigate('Chat', { orderId: order.id, showDispute: true })}>
              <Text style={styles.actionBtnText}>⚠️ Raise Dispute</Text>
            </TouchableOpacity>
          )}
        </View>
        {order.status === 'pending' && (
          <Text style={{ fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.sm, fontStyle: 'italic' }}>
            Waiting for vendor to accept your order...
          </Text>
        )}
      </View>
      {showReview && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Write a Review</Text>
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <TouchableOpacity key={s} onPress={() => setRating(s)}>
                <Text style={{ fontSize: 32, color: s <= rating ? '#FFC107' : '#DDD' }}>★</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={styles.input} placeholder="Share your experience..." value={comment} onChangeText={setComment} multiline />
          <TouchableOpacity style={styles.submitBtn} onPress={submitReview}><Text style={styles.submitBtnText}>Submit Review</Text></TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  back: { fontSize: fontSize.md, color: colors.primary, fontWeight: '600', padding: spacing.md },
  orderNum: { fontSize: fontSize.xl, fontWeight: '700', paddingHorizontal: spacing.md },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md, paddingTop: spacing.sm },
  status: { fontSize: fontSize.md, fontWeight: '600', textTransform: 'capitalize' },
  paymentStatus: { fontSize: fontSize.sm, color: colors.textMuted },
  section: { backgroundColor: colors.white, margin: spacing.md, marginTop: 0, padding: spacing.md, borderRadius: 12 },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '600', marginBottom: spacing.sm },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  actionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn: { padding: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: colors.info },
  actionBtnText: { color: colors.white, fontWeight: '500', fontSize: fontSize.sm },
  starRow: { flexDirection: 'row', justifyContent: 'center', gap: 4, marginBottom: spacing.sm },
  input: { backgroundColor: colors.background, padding: spacing.md, borderRadius: 8, fontSize: fontSize.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  submitBtn: { backgroundColor: colors.primary, padding: spacing.sm, borderRadius: 8, alignItems: 'center' },
  submitBtnText: { color: colors.white, fontWeight: '600' },
});
