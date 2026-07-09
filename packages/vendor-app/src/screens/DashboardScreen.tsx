import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { vendor as vendorApi, orders as ordersApi } from '../services/api';
import { colors, spacing, fontSize } from '../constants/theme';

export default function DashboardScreen({ navigation }: any) {
  const { vendor, refreshVendor } = useAuth();
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const [ordersRes, statsRes] = await Promise.all([
        ordersApi.list('pending'),
        vendorApi.getDashboard(),
      ]);
      setPendingOrders(ordersRes.data.data || []);
      setStats(statsRes.data.data);
    } catch { }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const onRefresh = () => { setRefreshing(true); fetch(); refreshVendor(); };

  const handleOrderAction = async (orderId: number, action: string) => {
    try {
      await ordersApi.updateStatus(orderId, action);
      fetch();
    } catch (err: any) { Alert.alert('Error', err.response?.data?.message); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{vendor?.business_name || 'Dashboard'}</Text>
        <TouchableOpacity style={[styles.openBtn, vendor?.is_open ? styles.openActive : {}]} onPress={async () => {
          await vendorApi.toggleOpen();
          refreshVendor();
        }}>
          <Text style={[styles.openBtnText, vendor?.is_open && { color: colors.primary }]}>
            {vendor?.is_open ? '🟢 Open' : '🔴 Closed'}
          </Text>
        </TouchableOpacity>
      </View>

      {vendor?.status !== 'approved' && (
        <View style={styles.vettingBanner}>
          <Text style={styles.vettingText}>
            {vendor?.status === 'pending' ? '⏳ Your business is being reviewed. You\'ll go live once approved.' :
             vendor?.status === 'vetting' ? '🔍 Your documents are being verified. We\'ll notify you soon.' :
             vendor?.status === 'rejected' ? '❌ Your application was not approved. Contact support.' :
             '⚠️ Your account is suspended. Contact support.'}
          </Text>
        </View>
      )}

      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}><Text style={styles.statVal}>{stats.pendingOrders}</Text><Text style={styles.statLabel}>Pending</Text></View>
          <View style={styles.statCard}><Text style={styles.statVal}>{stats.todayOrders}</Text><Text style={styles.statLabel}>Today</Text></View>
          <View style={styles.statCard}><Text style={styles.statVal}>₦{Number(stats.todayRevenue || 0).toLocaleString()}</Text><Text style={styles.statLabel}>Revenue</Text></View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Incoming Orders ({pendingOrders.length})</Text>

      {pendingOrders.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 48 }}>🛵</Text>
          <Text style={styles.emptyText}>No incoming orders</Text>
          <Text style={styles.emptySub}>Your shop is {vendor?.is_open ? 'open' : 'closed'}. New orders will appear here instantly.</Text>
        </View>
      ) : (
        <FlatList data={pendingOrders} renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderNum}>{item.order_number}</Text>
              <Text style={styles.orderTime}>{new Date(item.created_at).toLocaleTimeString()}</Text>
            </View>
            <Text style={styles.deliveryMethod}>{item.delivery_method.toUpperCase()} • ₦{Number(item.total_amount).toLocaleString()}</Text>
            {item.notes && <Text style={styles.notes}>📝 {item.notes}</Text>}
            {item.items?.map((oi: any, i: number) => (
              <Text key={i} style={styles.itemText}>• {oi.name} x{oi.quantity} = ₦{Number(oi.subtotal).toLocaleString()}</Text>
            ))}
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.success }]} onPress={() => handleOrderAction(item.id, 'accepted')}>
                <Text style={styles.actionBtnText}>✅ Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.error }]} onPress={() => {
                Alert.alert('Decline Order?', 'Are you sure?', [
                  { text: 'No' },
                  { text: 'Yes', onPress: () => handleOrderAction(item.id, 'declined') },
                ]);
              }}>
                <Text style={styles.actionBtnText}>❌ Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        )} keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: spacing.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, backgroundColor: colors.secondary },
  greeting: { fontSize: fontSize.xl, fontWeight: '700', color: colors.white },
  openBtn: { padding: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' },
  openActive: { backgroundColor: 'rgba(40,167,69,0.2)' },
  openBtnText: { color: colors.white, fontWeight: '600', fontSize: fontSize.sm },
  vettingBanner: { backgroundColor: '#FFF3CD', padding: spacing.md, margin: spacing.md, borderRadius: 8, borderWidth: 1, borderColor: '#FFC107' },
  vettingText: { color: '#856404', fontSize: fontSize.sm },
  statsRow: { flexDirection: 'row', padding: spacing.md, gap: spacing.sm },
  statCard: { flex: 1, backgroundColor: colors.white, padding: spacing.md, borderRadius: 10, alignItems: 'center' },
  statVal: { fontSize: fontSize.xl, fontWeight: '700', color: colors.primary },
  statLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '600', paddingHorizontal: spacing.md },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyText: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text, marginTop: spacing.md },
  emptySub: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
  orderCard: { backgroundColor: colors.white, padding: spacing.md, borderRadius: 12, marginBottom: spacing.sm, borderLeftWidth: 4, borderLeftColor: colors.warning, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  orderNum: { fontFamily: 'monospace', fontSize: fontSize.sm, fontWeight: '700' },
  orderTime: { fontSize: fontSize.xs, color: colors.textMuted },
  deliveryMethod: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '600', marginBottom: 4 },
  notes: { fontSize: fontSize.sm, color: colors.textMuted, fontStyle: 'italic', marginBottom: 4 },
  itemText: { fontSize: fontSize.sm, color: colors.text, marginLeft: spacing.sm },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  actionBtn: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
  actionBtnText: { color: colors.white, fontWeight: '600', fontSize: fontSize.sm },
});
