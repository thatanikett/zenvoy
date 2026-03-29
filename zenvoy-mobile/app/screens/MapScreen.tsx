import Mapbox, {
  Camera,
  LineLayer,
  MapView,
  ShapeSource,
  UserLocation,
  UserLocationRenderMode,
} from '@rnmapbox/maps';
import Geolocation from 'react-native-geolocation-service';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  PermissionsAndroid,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import SearchBar from '../components/SearchBar';
import { fetchFastRoute, fetchSafeRoute, postSOS } from '../services/route';

Mapbox.setAccessToken(
  'YOUR_ACCESS_TOKEN_HERE'
);

type LocationSelection = {
  label: string;
  lat: number;
  lng: number;
};

type SelectedRoute = 'safe' | 'fast' | null;

const C = {
  sage: '#A2B29F',
  surface: '#0f1115',
  glass: 'rgba(20,20,20,0.7)',
  glassBorder: 'rgba(255,255,255,0.15)',
};

const MAP_STYLE = 'mapbox://styles/mapbox/dark-v11';

const SAFE_ROUTE_LINE_STYLE = {
  lineColor: '#d9ef92',
  lineWidth: 6,
  lineOpacity: 0.95,
  lineCap: 'round',
  lineJoin: 'round',
};

const FAST_ROUTE_LINE_STYLE = {
  lineColor: '#76a8ff',
  lineWidth: 5,
  lineOpacity: 0.9,
  lineCap: 'round',
  lineJoin: 'round',
  lineDasharray: [2, 1.2],
};

const toLngLatCoordinates = (coordinates: [number, number][]) =>
  coordinates.map(([lat, lng]) => [lng, lat] as [number, number]);

const getBoundsFromCoordinates = (coordinates: [number, number][]) => {
  if (coordinates.length < 2) {
    return null;
  }

  let minLng = coordinates[0][0];
  let minLat = coordinates[0][1];
  let maxLng = coordinates[0][0];
  let maxLat = coordinates[0][1];

  coordinates.forEach(([lng, lat]) => {
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  });

  return {
    ne: [maxLng, maxLat] as [number, number],
    sw: [minLng, minLat] as [number, number],
  };
};

export default function MapScreen() {
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [origin, setOrigin] = useState<LocationSelection | null>(null);
  const [destination, setDestination] = useState<LocationSelection | null>(null);
  const [safeRouteLine, setSafeRouteLine] = useState<[number, number][]>([]);
  const [fastRouteLine, setFastRouteLine] = useState<[number, number][]>([]);
  const [selectedRoute, setSelectedRoute] = useState<SelectedRoute>(null);
  const [loading, setLoading] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  const [routeSummary, setRouteSummary] = useState(
    'Pick source and destination to compare routes.'
  );
  const cameraRef = useRef<Camera>(null);

  const safeLineStyle = useMemo(
    () => ({
      ...SAFE_ROUTE_LINE_STYLE,
      lineOpacity: selectedRoute === 'fast' ? 0.35 : 0.95,
      lineWidth: selectedRoute === 'safe' ? 7 : SAFE_ROUTE_LINE_STYLE.lineWidth,
    }),
    [selectedRoute]
  );

  const fastLineStyle = useMemo(
    () => ({
      ...FAST_ROUTE_LINE_STYLE,
      lineOpacity: selectedRoute === 'safe' ? 0.35 : 0.9,
      lineWidth: selectedRoute === 'fast' ? 6 : FAST_ROUTE_LINE_STYLE.lineWidth,
    }),
    [selectedRoute]
  );

  const safeRouteFeature = useMemo(() => {
    if (safeRouteLine.length < 2) {
      return null;
    }

    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: safeRouteLine,
      },
    };
  }, [safeRouteLine]);

  const fastRouteFeature = useMemo(() => {
    if (fastRouteLine.length < 2) {
      return null;
    }

    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: fastRouteLine,
      },
    };
  }, [fastRouteLine]);

  useEffect(() => {
    const requestLocationPermission = async () => {
      let hasPermission = false;

      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'App needs access to your location',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        hasPermission = true;
      }

      if (!hasPermission) {
        return;
      }

      Geolocation.getCurrentPosition(
        position => {
          const { longitude, latitude } = position.coords;
          setUserCoords([longitude, latitude]);
        },
        error => {
          console.log('Location error:', error);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    };

    requestLocationPermission();
  }, []);

  const handleCenterUser = () => {
    if (userCoords && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: userCoords,
        zoomLevel: 15,
        animationDuration: 800,
      });
    }
  };

  const focusRoute = (route: SelectedRoute) => {
    if (!cameraRef.current || !route) {
      return;
    }

    const coordinates = route === 'safe' ? safeRouteLine : fastRouteLine;
    const bounds = getBoundsFromCoordinates(coordinates);

    if (!bounds) {
      return;
    }

    setSelectedRoute(route);
    cameraRef.current.fitBounds(bounds.ne, bounds.sw, [70, 30, 250, 30], 900);
  };

  const handleSearch = async () => {
    if (!origin || !destination) {
      return;
    }

    setLoading(true);
    setRouteSummary('Running route analysis...');

    try {
      const [safeRoute, fastRoute] = await Promise.all([
        fetchSafeRoute(origin.lat, origin.lng, destination.lat, destination.lng),
        fetchFastRoute(origin.lat, origin.lng, destination.lat, destination.lng),
      ]);

      const safeLine = toLngLatCoordinates(safeRoute.coordinates);
      const fastLine = toLngLatCoordinates(fastRoute.coordinates);
      setSafeRouteLine(safeLine);
      setFastRouteLine(fastLine);
      setSelectedRoute(null);

      const allCoordinates = [...safeLine, ...fastLine];
      const bounds = getBoundsFromCoordinates(allCoordinates);
      if (bounds && cameraRef.current) {
        cameraRef.current.fitBounds(bounds.ne, bounds.sw, [70, 30, 250, 30], 900);
      }

      const safeMinutes = Math.round(safeRoute.estimated_time_min);
      const fastMinutes = Math.round(fastRoute.estimated_time_min);
      const safeKm = safeRoute.distance_km.toFixed(1);
      const fastKm = fastRoute.distance_km.toFixed(1);

      setRouteSummary(
        `Safe route ${safeKm} km • ${safeMinutes} min. Fast route ${fastKm} km • ${fastMinutes} min.`
      );
    } catch (error) {
      console.log('Route fetch error:', error);
      setRouteSummary('Unable to fetch routes right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSOS = async () => {
    try {               
      setSosLoading(true);

      const liveCoords = await new Promise<[number, number]>((resolve, reject) => {
        Geolocation.getCurrentPosition(
          position => {
            resolve([position.coords.longitude, position.coords.latitude]);
          },
          error => {
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 12000,
            maximumAge: 0,
            forceRequestLocation: true,
            showLocationDialog: true,
          }
        );
      });

      setUserCoords(liveCoords);

      const [lng, lat] = liveCoords;
      const response = await postSOS(lat, lng, 'ZenVoy User', '+919990656858');
      Alert.alert('SOS sent', response.message || 'Emergency alert has been sent.');
    } catch (error: any) {
      Alert.alert(
        'SOS failed',
        error?.message || 'Could not get current GPS location. Please try again.'
      );
    } finally {
      setSosLoading(false);
    }
  };

  const handleReset = () => {
    setOrigin(null);
    setDestination(null);
    setSafeRouteLine([]);
    setFastRouteLine([]);
    setSelectedRoute(null);
    setRouteSummary('Pick source and destination to compare routes.');
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <MapView
        style={StyleSheet.absoluteFill}
        styleURL={MAP_STYLE}
        compassEnabled={false}
        logoEnabled={false}
        attributionEnabled={false}
        scaleBarEnabled={false}
      >
        <Camera
          ref={cameraRef}
          centerCoordinate={userCoords ?? [77.209, 28.6139]}
          zoomLevel={14}
          animationMode="flyTo"
          animationDuration={1200}
        />
        <UserLocation
          visible
          renderMode={UserLocationRenderMode.Normal}
          androidRenderMode="compass"
        />
        {safeRouteFeature ? (
          <ShapeSource id="safeRouteSource" shape={safeRouteFeature as any}>
            <LineLayer id="safeRouteLayer" style={safeLineStyle as any} />
          </ShapeSource>
        ) : null}
        {fastRouteFeature ? (
          <ShapeSource id="fastRouteSource" shape={fastRouteFeature as any}>
            <LineLayer id="fastRouteLayer" style={fastLineStyle as any} />
          </ShapeSource>
        ) : null}
      </MapView>

      <View style={s.mapTint} pointerEvents="none" />

      <SearchBar
        onOriginSelect={setOrigin}
        onDestinationSelect={setDestination}
        onSearch={handleSearch}
        origin={origin}
        destination={destination}
        myLocation={userCoords}
        hasRoutesFetched={safeRouteLine.length > 1 || fastRouteLine.length > 1}
        loading={loading}
        onReset={handleReset}
        canSearch={Boolean(origin && destination)}
      />

      <View style={s.fabs} pointerEvents="box-none">
        <TouchableOpacity style={s.fabSos} onPress={handleSOS} activeOpacity={0.85}>
          <Text style={s.fabSosText}>{sosLoading ? '...' : 'SOS'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.fabPrimary} onPress={handleCenterUser} activeOpacity={0.85}>
          <Text style={s.fabPrimaryIcon}>📍</Text>
        </TouchableOpacity>
      </View>

      <View style={s.summaryCard}>
        <Text style={s.summaryLabel}>ANALYSIS</Text>
        {safeRouteLine.length > 1 || fastRouteLine.length > 1 ? (
          <View style={s.routeChipRow}>
            <TouchableOpacity
              style={[s.routeChip, selectedRoute === 'safe' && s.routeChipActiveSafe]}
              onPress={() => focusRoute('safe')}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  s.routeChipText,
                  selectedRoute === 'safe' && s.routeChipTextActive,
                ]}
              >
                SAFE
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.routeChip, selectedRoute === 'fast' && s.routeChipActiveFast]}
              onPress={() => focusRoute('fast')}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  s.routeChipText,
                  selectedRoute === 'fast' && s.routeChipTextActive,
                ]}
              >
                FAST
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
        <Text style={s.summaryText}>{routeSummary}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },
  mapTint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(162,178,159,0.05)' },
  fabs: { position: 'absolute', right: 20, bottom: 132, gap: 12, alignItems: 'center' },
  fabPrimary: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.sage,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  fabSos: {
    minWidth: 52,
    height: 52,
    borderRadius: 26,
    paddingHorizontal: 14,
    backgroundColor: '#f35b6e',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  fabSosText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  fabPrimaryIcon: { fontSize: 22 },
  summaryCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 26,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(11,15,20,0.84)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  summaryLabel: {
    color: '#8f98a8',
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '700',
    marginBottom: 4,
  },
  routeChipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  routeChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  routeChipActiveSafe: {
    borderColor: 'rgba(217,239,146,0.55)',
    backgroundColor: 'rgba(217,239,146,0.15)',
  },
  routeChipActiveFast: {
    borderColor: 'rgba(118,168,255,0.55)',
    backgroundColor: 'rgba(118,168,255,0.15)',
  },
  routeChipText: {
    color: '#a9b3c5',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  routeChipTextActive: {
    color: '#e9f0ff',
  },
  summaryText: {
    color: '#d6deeb',
    fontSize: 13,
    lineHeight: 18,
  },
});
