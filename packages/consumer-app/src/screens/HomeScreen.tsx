import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { discover } from '../services/api';
import { colors, spacing, fontSize } from '../constants/theme';

export default function HomeScreen({ navigation }: any) {
  const [vendors, setVendors] = useState<any[]>([]);
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showMap, setShowMap] = useState(false);

  const getLocationAndFetch = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);

      const res = await discover.getNearby(loc.coords.latitude, loc.coords.longitude);
      setVendors(res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { getLocationAndFetch(); }, []);

  const onRefresh = () => { setRefreshing(true); getLocationAndFetch(); };

  const filtered = search
    ? vendors.filter((v: any) => v.vendor?.business_name?.toLowerCase().includes(search.toLowerCase()))
    : vendors;

  const renderVendor = ({ item }: any) => {
    const v = item.vendor;
    const est = item.deliveryEstimate;
    return (
      <TouchableOpacity style={styles.vendorCard} onPress={() => navigation.navigate('VendorDetail', { vendorId: v.id })}>
        <View style={styles.vendorInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{v.business_name?.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.vendorName}>{v.business_name}</Text>
            <Text style={styles.cuisine}>{v.cuisine_type} • ★ {v.rating}</Text>
            {est && <Text style={styles.eta}>~{est.estimatedMinutes} min • ₦{est.deliveryFee} delivery</Text>}
            <Text style={styles.distance}>{est?.distanceKm} km away</Text>
          </View>
        </View>
        {item.menuItems?.slice(0, 3).map((m: any) => (
          <Text key={m.id} style={styles.menuItem}>• {m.name} - ₦{Number(m.price).toLocaleString()}</Text>
        ))}
      </TouchableOpacity>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}!</Text>
        <Text style={styles.title}>What are you craving?</Text>
      </View>
      <TextInput style={styles.searchBar} placeholder="Search vendors or cuisines..." value={search} onChangeText={setSearch} />
      <View style={styles.toggleRow}>
        <TouchableOpacity onPress={() => setShowMap(false)} style={[styles.toggleBtn, !showMap && styles.toggleActive]}>
          <Text style={[styles.toggleText, !showMap && { color: colors.primary }]}>List</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowMap(true)} style={[styles.toggleBtn, showMap && styles.toggleActive]}>
          <Text style={[styles.toggleText, showMap && { color: colors.primary }]}>Map</Text>
        </TouchableOpacity>
      </View>
      {showMap && location ? (
        <View style={{ flex: 1 }}>
          <MapView style={{ flex: 1 }} initialRegion={{ latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }}>
            {vendors.map((v: any) => (
              <Marker key={v.vendor.id} coordinate={{ latitude: Number(v.vendor.latitude), longitude: Number(v.vendor.longitude) }}
                title={v.vendor.business_name} onPress={() => navigation.navigate('VendorDetail', { vendorId: v.vendor.id })}
              />
            ))}
          </MapView>
        </View>
      ) : (
        <FlatList data={filtered} renderItem={renderVendor} keyExtractor={(item: any) => String(item.vendor.id)}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          ListEmptyComponent={<View style={styles.center}><Text style={{ color: colors.textMuted }}>No vendors found nearby</Text></View>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: spacing.md, paddingTop: spacing.sm },
  greeting: { fontSize: fontSize.sm, color: colors.textMuted },
  title: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text, marginTop: 2 },
  searchBar: { backgroundColor: colors.white, margin: spacing.md, padding: spacing.md, borderRadius: 12, fontSize: fontSize.md, borderWidth: 1, borderColor: colors.border },
  toggleRow: { flexDirection: 'row', marginHorizontal: spacing.md, marginBottom: spacing.sm, gap: 8 },
  toggleBtn: { padding: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: colors.white },
  toggleActive: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.primary },
  toggleText: { fontSize: fontSize.sm, fontWeight: '500', color: colors.textMuted },
  vendorCard: { backgroundColor: colors.white, marginHorizontal: spacing.md, marginBottom: spacing.sm, padding: spacing.md, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  vendorInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm },
  avatarText: { color: colors.white, fontSize: fontSize.lg, fontWeight: '700' },
  vendorName: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  cuisine: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  eta: { fontSize: fontSize.xs, color: colors.success, marginTop: 2 },
  distance: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
  menuItem: { fontSize: fontSize.sm, color: colors.textLight, paddingLeft: 56, marginTop: 2 },
});
