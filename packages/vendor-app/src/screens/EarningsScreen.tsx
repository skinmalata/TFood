import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { vendor as vendorApi } from '../services/api';
import { colors, spacing, fontSize } from '../constants/theme';

export default function EarningsScreen() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorApi.getDashboard().then((res) => setStats(res.data.data)).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Earnings</Text>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Today's Revenue</Text>
        <Text style={styles.balanceAmount}>₦{Number(stats?.todayRevenue || 0).toLocaleString()}</Text>
      </View>
      <View style={styles.statsGrid}>
        <View style={styles.stat}><Text style={styles.statVal}>₦{Number(stats?.totalRevenue || 0).toLocaleString()}</Text><Text style={styles.statLabel}>Total Revenue</Text></View>
        <View style={styles.stat}><Text style={styles.statVal}>{stats?.totalOrders || 0}</Text><Text style={styles.statLabel}>Total Orders</Text></View>
        <View style={styles.stat}><Text style={styles.statVal}>{stats?.todayOrders || 0}</Text><Text style={styles.statLabel}>Today's Orders</Text></View>
        <View style={styles.stat}><Text style={styles.statVal}>{stats?.pendingOrders || 0}</Text><Text style={styles.statLabel}>Pending</Text></View>
      </View>
      <View style={styles.info}>
        <Text style={styles.infoText}>Payouts are processed monthly to your registered bank account.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: fontSize.xxl, fontWeight: '700', padding: spacing.md },
  balanceCard: { backgroundColor: colors.secondary, margin: spacing.md, padding: spacing.xl, borderRadius: 16 },
  balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: fontSize.sm },
  balanceAmount: { color: colors.white, fontSize: 36, fontWeight: '800', marginTop: spacing.sm },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: spacing.md, gap: spacing.sm },
  stat: { width: '47%', backgroundColor: colors.white, padding: spacing.md, borderRadius: 12 },
  statVal: { fontSize: fontSize.xl, fontWeight: '700', color: colors.primary },
  statLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  info: { margin: spacing.md, padding: spacing.md, backgroundColor: colors.white, borderRadius: 10 },
  infoText: { fontSize: fontSize.sm, color: colors.textMuted, fontStyle: 'italic' },
});
