import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { orders as ordersApi } from '../services/api';
import { colors, spacing, fontSize } from '../constants/theme';

const statusColor: Record<string, string> = {
  pending: colors.warning,
  accepted: colors.info,
  preparing: colors.info,
  ready: colors.success,
  out_for_delivery: colors.primary,
  delivered: colors.success,
  cancelled: colors.error,
  declined: colors.error,
};

export default function OrdersScreen({ navigation }: any) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('');

  const fetch = useCallback(async () => {
    try {
      const res = await ordersApi.list(filter || undefined);
      setOrders(res.data.data || []);
    } catch { }
    finally { setLoading(false); setRefreshing(false); }
  }, [filter]);

  useEffect(() => { fetch(); }, [fetch]);

  const onRefresh = () => { setRefreshing(true); fetch(); };

  const renderOrder = ({ item }: any) => (
    <TouchableOpacity style={styles.orderCard} onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderNum}>{item.order_number}</Text>
        <Text style={[styles.statusBadge, { color: statusColor[item.status] || colors.textMuted }]}>{item.status?.replace(/_/g, ' ')}</Text>
      </View>
      <Text style={styles.vendorName}>{item.business_name}</Text>
      <Text style={styles.orderMeta}>{new Date(item.created_at).toLocaleDateString('en-NG')} • ₦{Number(item.total_amount).toLocaleString()}</Text>
      <Text style={styles.deliveryMethod}>{item.delivery_method} • Payment: {item.payment_status}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>My Orders</Text>
      <View style={styles.filterRow}>
        {['', 'pending', 'accepted', 'delivered', 'cancelled'].map((s) => (
          <TouchableOpacity key={s} onPress={() => setFilter(s)} style={[styles.filterBtn, filter === s && styles.filterActive]}>
            <Text style={[styles.filterText, filter === s && { color: colors.primary }]}>{s || 'All'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View> : (
        <FlatList data={orders} renderItem={renderOrder} keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          ListEmptyComponent={<View style={styles.center}><Text style={{ color: colors.textMuted }}>No orders yet</Text></View>}
          contentContainerStyle={{ padding: spacing.md }} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: fontSize.xxl, fontWeight: '700', padding: spacing.md, paddingBottom: 0 },
  filterRow: { flexDirection: 'row', padding: spacing.md, gap: 8 },
  filterBtn: { padding: 6, paddingHorizontal: 14, borderRadius: 16, backgroundColor: colors.white },
  filterActive: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.primary },
  filterText: { fontSize: fontSize.sm, color: colors.textMuted },
  orderCard: { backgroundColor: colors.white, padding: spacing.md, borderRadius: 12, marginBottom: spacing.sm, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  orderNum: { fontFamily: 'monospace', fontSize: fontSize.sm, fontWeight: '600' },
  statusBadge: { fontSize: fontSize.sm, fontWeight: '600', textTransform: 'capitalize' },
  vendorName: { fontSize: fontSize.md, fontWeight: '500', marginTop: 2 },
  orderMeta: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 4 },
  deliveryMethod: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
});
