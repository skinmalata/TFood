import axios from 'axios';
import { config } from '../config/env';
import { DeliveryEstimate } from '@tfood/shared';

const googleMaps = axios.create({
  baseURL: 'https://maps.googleapis.com/maps/api',
  params: { key: config.GOOGLE_MAPS_API_KEY },
});

export const calculateDistance = async (
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<{ distanceKm: number; durationMinutes: number }> => {
  try {
    const response = await googleMaps.get('/distancematrix/json', {
      params: {
        origins: `${originLat},${originLng}`,
        destinations: `${destLat},${destLng}`,
        units: 'metric',
      },
    });

    const element = response.data.rows[0]?.elements[0];
    if (!element || element.status !== 'OK') {
      // Fallback: approximate using Haversine formula
      return haversineDistance(originLat, originLng, destLat, destLng);
    }

    return {
      distanceKm: element.distance.value / 1000,
      durationMinutes: Math.ceil(element.duration.value / 60),
    };
  } catch {
    return haversineDistance(originLat, originLng, destLat, destLng);
  }
};

export const getDeliveryEstimate = async (
  vendorLat: number,
  vendorLng: number,
  consumerLat: number,
  consumerLng: number,
  preparationTime: number,
  deliveryRadius: number
): Promise<DeliveryEstimate> => {
  const { distanceKm, durationMinutes } = await calculateDistance(
    vendorLat, vendorLng, consumerLat, consumerLng
  );

  if (distanceKm > deliveryRadius) {
    throw new Error(`Vendor is ${distanceKm.toFixed(1)}km away, which exceeds their ${deliveryRadius}km delivery radius.`);
  }

  const deliveryFee = calculateDeliveryFee(distanceKm);
  const estimatedMinutes = durationMinutes + preparationTime;

  return {
    distanceKm: Math.round(distanceKm * 10) / 10,
    estimatedMinutes,
    deliveryFee,
  };
};

export const calculateDeliveryFee = (distanceKm: number): number => {
  if (distanceKm <= 1) return 500;
  if (distanceKm <= 3) return 800;
  if (distanceKm <= 5) return 1200;
  if (distanceKm <= 10) return 1500;
  if (distanceKm <= 15) return 2000;
  return 3000;
};

export const findNearbyVendors = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 10
): Promise<any[]> => {
  // MySQL spatial query using bounding box approximation
  const db = require('../config/database').default;
  const latDelta = radiusKm / 111.32;
  const lngDelta = radiusKm / (111.32 * Math.cos(latitude * Math.PI / 180));

  const vendors = await db('vendors')
    .where('status', 'approved')
    .where('is_open', true)
    .whereBetween('latitude', [latitude - latDelta, latitude + latDelta])
    .whereBetween('longitude', [longitude - lngDelta, longitude + lngDelta]);

  return vendors;
};

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): { distanceKm: number; durationMinutes: number } {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;
  // Average urban driving speed ~25 km/h
  const durationMinutes = Math.ceil((distanceKm / 25) * 60);
  return { distanceKm: Math.round(distanceKm * 10) / 10, durationMinutes: Math.max(durationMinutes, 5) };
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
