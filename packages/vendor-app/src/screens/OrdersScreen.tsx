import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { orders as ordersApi } from '../services/api';
import { colors, spacing, fontSize } from '../constants/theme';

const statusColor: Record<string, string> = {
  pending: colors.warning, accepted: colors.info, preparing: colors.info,
  ready: colors.success, out_for_delivery: colors.primary,
  delivered: colors.success, cancelled: colors.error, declined: colors.error,
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

  const updateStatus = async (id: number, status: string) => {
    try {
      await ordersApi.updateStatus(id, status);
      fetch();
    } catch { }
  };

  const renderOrder = ({ item }: any) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}>
      <View style={styles.row}>
        <Text style={styles.orderNum}>{item.order_number}</Text>
        <Text style={[styles.status, { color: statusColor[item.status] || colors.textMuted }]}>{item.status}</Text>
      </View>
      <Text style={styles.amount}>₦{Number(item.total_amount).toLocaleString()} • {item.delivery_method}</Text>
      {item.status === 'accepted' && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.smallBtn} onPress={() => updateStatus(item.id, 'preparing')}><Text style={styles.smallBtnText}>Start Preparing</Text></TouchableOpacity>
        </View>
      )}
      {item.status === 'preparing' && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.smallBtn} onPress={() => updateStatus(item.id, 'ready')}><Text style={styles.smallBtnText}>Mark Ready</Text></TouchableOpacity>
        </View>
      )}
      {item.status === 'ready' && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.smallBtn} onPress={() => updateStatus(item.id, 'out_for_delivery')}><Text style={styles.smallBtnText}>Out for Delivery</Text></TouchableOpacity>
        </View>
      )}
      {item.status === 'out_for_delivery' && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.smallBtn, { backgroundColor: colors.success }]} onPress={() => updateStatus(item.id, 'delivered')}><Text style={styles.smallBtnText}>✓ Mark Delivered</Text></TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Orders</Text>
      <View style={styles.filterRow}>
        {['', 'pending', 'accepted', 'preparing', 'ready', 'delivered'].map((s) => (
          <TouchableOpacity key={s} onPress={() => setFilter(s)} style={[styles.filterBtn, filter === s && { borderColor: colors.primary }]}>
            <Text style={[styles.filterText, filter === s && { color: colors.primary }]}>{s || 'All'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View> : (
        <FlatList data={orders} renderItem={renderOrder} keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          ListEmptyComponent={<View style={styles.center}><Text style={{ color: colors.textMuted }}>No orders found</Text></View>}
          contentContainerStyle={{ padding: spacing.md }} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: fontSize.xxl, fontWeight: '700', padding: spacing.md, paddingBottom: 0 },
  filterRow: { flexDirection: 'row', padding: spacing.md, gap: 6, flexWrap: 'wrap' },
  filterBtn: { padding: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  filterText: { fontSize: fontSize.xs, color: colors.textMuted },
  card: { backgroundColor: colors.white, padding: spacing.md, borderRadius: 10, marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  orderNum: { fontFamily: 'monospace', fontWeight: '600', fontSize: fontSize.sm },
  status: { fontSize: fontSize.sm, fontWeight: '500', textTransform: 'capitalize' },
  amount: { fontSize: fontSize.sm, color: colors.textLight },
  actionRow: { flexDirection: 'row', marginTop: spacing.sm, gap: 8 },
  smallBtn: { padding: 8, paddingHorizontal: 14, borderRadius: 6, backgroundColor: colors.primary },
  smallBtnText: { color: colors.white, fontWeight: '500', fontSize: fontSize.xs },
});
