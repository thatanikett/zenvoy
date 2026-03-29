import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Config from 'react-native-config';

const DELHI_BBOX = [76.84, 28.4, 77.35, 28.88] as const;

type Field = 'origin' | 'destination';

type LocationSelection = {
  label: string;
  lat: number;
  lng: number;
};

type GeocodeSuggestion = {
  id: string;
  placeName: string;
  lat: number;
  lng: number;
};

interface SearchBarProps {
  onOriginSelect: (location: LocationSelection) => void;
  onDestinationSelect: (location: LocationSelection) => void;
  onSearch: () => void;
  origin: LocationSelection | null;
  destination: LocationSelection | null;
  myLocation: [number, number] | null;
  hasRoutesFetched: boolean;
  loading: boolean;
  onReset: () => void;
  canSearch: boolean;
}

function getMapboxToken(): string {
  return (
    "YOUR TOKEN HERE"
  );
}

export default function SearchBar({
  onOriginSelect,
  onDestinationSelect,
  onSearch,
  origin,
  destination,
  myLocation,
  hasRoutesFetched,
  loading,
  onReset,
  canSearch,
}: SearchBarProps) {
  const [originInput, setOriginInput] = useState(origin?.label ?? '');
  const [destinationInput, setDestinationInput] = useState(destination?.label ?? '');
  const [activeField, setActiveField] = useState<Field | null>(null);
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const riseAnim = useRef(new Animated.Value(10)).current;

  const mapboxToken = useMemo(() => getMapboxToken(), []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(riseAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, riseAnim]);

  useEffect(() => {
    setOriginInput(origin?.label ?? '');
  }, [origin?.label]);

  useEffect(() => {
    setDestinationInput(destination?.label ?? '');
  }, [destination?.label]);

  useEffect(() => {
    if (hasRoutesFetched) {
      setIsCollapsed(true);
      return;
    }

    setIsCollapsed(false);
  }, [hasRoutesFetched]);

  useEffect(() => {
    if (!activeField) {
      setSuggestions([]);
      return;
    }

    const query = (activeField === 'origin' ? originInput : destinationInput).trim();
    if (query.length < 2 || !mapboxToken) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        setIsLookingUp(true);
        const endpoint =
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
          `?access_token=${mapboxToken}` +
          `&bbox=${DELHI_BBOX.join(',')}` +
          '&country=in&limit=5&types=address,poi,place,neighborhood';

        const response = await fetch(endpoint, { signal: controller.signal });
        const data = await response.json();

        const parsed: GeocodeSuggestion[] = Array.isArray(data?.features)
          ? data.features
              .filter((item: any) => Array.isArray(item?.center) && item.center.length > 1)
              .map((item: any) => ({
                id: String(item.id ?? `${item.place_name}-${item.center[1]}`),
                placeName: String(item.place_name ?? ''),
                lng: Number(item.center[0]),
                lat: Number(item.center[1]),
              }))
          : [];

        setSuggestions(parsed);
      } catch (error: any) {
        if (error?.name !== 'AbortError') {
          setSuggestions([]);
        }
      } finally {
        setIsLookingUp(false);
      }
    }, 250);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [activeField, destinationInput, mapboxToken, originInput]);

  const onPickSuggestion = (field: Field, suggestion: GeocodeSuggestion) => {
    const payload = {
      label: suggestion.placeName,
      lat: suggestion.lat,
      lng: suggestion.lng,
    };

    if (field === 'origin') {
      setOriginInput(suggestion.placeName);
      onOriginSelect(payload);
    } else {
      setDestinationInput(suggestion.placeName);
      onDestinationSelect(payload);
    }

    setSuggestions([]);
    setActiveField(null);
    Keyboard.dismiss();
  };

  const clearAll = () => {
    setOriginInput('');
    setDestinationInput('');
    setSuggestions([]);
    setActiveField(null);
    onReset();
  };

  const useMyLocationAsOrigin = () => {
    if (!myLocation) {
      return;
    }

    const [lng, lat] = myLocation;
    const label = 'My current location';
    setOriginInput(label);
    onOriginSelect({ label, lat, lng });
    setSuggestions([]);
    setActiveField(null);
    Keyboard.dismiss();
  };

  if (hasRoutesFetched && isCollapsed) {
    return (
      <Animated.View
        style={[
          styles.floatingContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: riseAnim }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => setIsCollapsed(false)}
          style={styles.floatingButton}
          activeOpacity={0.88}
        >
          <Text style={styles.floatingButtonIcon}>🧭</Text>
          <Text style={styles.floatingButtonText}>ROUTE PANEL</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        hasRoutesFetched && styles.containerCompact,
        {
          opacity: fadeAnim,
          transform: [{ translateY: riseAnim }],
        },
      ]}
    >
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.brandWrap}>
            <View style={styles.logoBox}>
              <View style={styles.logoInner} />
            </View>
            <View>
              <Text style={styles.brand}>ZENVOY</Text>
              <Text style={styles.brandSub}>DELHI SAFETY MESH</Text>
            </View>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillText}>AI ROUTING</Text>
          </View>
        </View>

        {hasRoutesFetched ? (
          <TouchableOpacity
            onPress={() => setIsCollapsed(true)}
            style={styles.minimizeButton}
            activeOpacity={0.8}
          >
            <Text style={styles.minimizeButtonText}>MINIMIZE</Text>
          </TouchableOpacity>
        ) : null}

        {!hasRoutesFetched ? (
          <Text style={styles.intro}>
            Search a route, compare safety signals, and inspect the AI reasoning behind the recommendation.
          </Text>
        ) : null}

        <LocationBlock
          label="SOURCE"
          selected={originInput}
          description="Where are you starting from?"
          accentColor="#76a8ff"
        >
          <TextInput
            value={originInput}
            onChangeText={setOriginInput}
            onFocus={() => setActiveField('origin')}
            placeholder="Starting point..."
            placeholderTextColor="rgba(200,206,217,0.55)"
            style={styles.input}
          />
          {activeField === 'origin' ? (
            <SuggestionList
              loading={isLookingUp}
              suggestions={suggestions}
              showMyLocationOption={Boolean(myLocation)}
              onUseMyLocation={useMyLocationAsOrigin}
              onSelect={item => onPickSuggestion('origin', item)}
            />
          ) : null}
        </LocationBlock>

        <View style={styles.connector} />

        <LocationBlock
          label="DESTINATION"
          selected={destinationInput}
          description="Where do you need to go?"
          accentColor="#d9ef92"
        >
          <TextInput
            value={destinationInput}
            onChangeText={setDestinationInput}
            onFocus={() => setActiveField('destination')}
            placeholder="Where to?"
            placeholderTextColor="rgba(200,206,217,0.55)"
            style={styles.input}
          />
          {activeField === 'destination' ? (
            <SuggestionList
              loading={isLookingUp}
              suggestions={suggestions}
              onSelect={item => onPickSuggestion('destination', item)}
            />
          ) : null}
        </LocationBlock>

        <View style={styles.statusRow}>
          <View style={styles.statusTextWrap}>
            <Text style={styles.statusLabel}>ROUTE STATUS</Text>
            <Text style={styles.statusValue}>
              {!origin && !destination && 'Set your start point to begin.'}
              {origin && !destination && 'Destination pending.'}
              {origin && destination && !loading && 'Ready for AI route comparison.'}
              {loading && 'Gathering route signals from the backend.'}
            </Text>
          </View>
          <TouchableOpacity onPress={clearAll} style={styles.clearButton}>
            <Text style={styles.clearText}>CLEAR</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={onSearch}
          disabled={!canSearch || loading}
          style={[
            styles.searchButton,
            (!canSearch || loading) && styles.searchButtonDisabled,
          ]}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.searchButtonText,
              (!canSearch || loading) && styles.searchButtonTextDisabled,
            ]}
          >
            {loading ? 'RUNNING SAFETY ANALYSIS' : 'SEARCH SAFEST VS FASTEST'}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

function LocationBlock({
  label,
  selected,
  description,
  accentColor,
  children,
}: {
  label: string;
  selected: string;
  description: string;
  accentColor: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.locationBlock}>
      <View style={styles.locationHeader}>
        <View style={[styles.dot, { backgroundColor: accentColor }]} />
        <Text style={styles.locationLabel}>{label}</Text>
      </View>

      <View style={styles.inputShell}>{children}</View>

      <Text style={[styles.locationDescription, selected ? styles.locationSelected : null]}>
        {selected || description}
      </Text>
    </View>
  );
}

function SuggestionList({
  loading,
  suggestions,
  showMyLocationOption,
  onUseMyLocation,
  onSelect,
}: {
  loading: boolean;
  suggestions: GeocodeSuggestion[];
  showMyLocationOption?: boolean;
  onUseMyLocation?: () => void;
  onSelect: (item: GeocodeSuggestion) => void;
}) {
  if (loading) {
    return (
      <View style={styles.suggestionsWrap}>
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#d9ef92" />
          <Text style={styles.loadingText}>Finding places...</Text>
        </View>
      </View>
    );
  }

  if (suggestions.length === 0 && !showMyLocationOption) {
    return null;
  }

  return (
    <View style={styles.suggestionsWrap}>
      {showMyLocationOption ? (
        <TouchableOpacity
          style={styles.myLocationItem}
          onPress={onUseMyLocation}
          activeOpacity={0.8}
        >
          <Text style={styles.myLocationText}>Use my location</Text>
        </TouchableOpacity>
      ) : null}
      {suggestions.map(item => (
        <TouchableOpacity
          key={item.id}
          style={styles.suggestionItem}
          onPress={() => onSelect(item)}
          activeOpacity={0.8}
        >
          <Text style={styles.suggestionText} numberOfLines={2}>
            {item.placeName}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 24,
    left: 16,
    right: 16,
    zIndex: 20,
  },
  containerCompact: {
    right: undefined,
    width: 306,
  },
  floatingContainer: {
    position: 'absolute',
    top: 24,
    left: 16,
    zIndex: 21,
  },
  floatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(11,15,20,0.9)',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  floatingButtonIcon: {
    fontSize: 14,
  },
  floatingButtonText: {
    color: '#d9ef92',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  card: {
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    backgroundColor: 'rgba(11,15,20,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d9ef92',
  },
  logoInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#11161d',
  },
  brand: {
    color: '#f4f7ff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  brandSub: {
    color: '#9ea8ba',
    fontSize: 10,
    letterSpacing: 1.4,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(217,239,146,0.22)',
    backgroundColor: 'rgba(217,239,146,0.08)',
  },
  pillText: {
    color: '#d9ef92',
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  minimizeButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  minimizeButtonText: {
    color: '#9da8bc',
    fontSize: 10,
    letterSpacing: 1.1,
    fontWeight: '700',
  },
  intro: {
    color: '#b3bdcc',
    fontSize: 13,
    lineHeight: 20,
  },
  locationBlock: {
    gap: 10,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 8,
  },
  locationLabel: {
    color: '#8f98a8',
    letterSpacing: 1.6,
    fontSize: 10,
    fontWeight: '700',
  },
  inputShell: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.035)',
  },
  input: {
    color: '#f4f7ff',
    fontSize: 14,
    paddingVertical: 0,
  },
  connector: {
    marginLeft: 14,
    width: 1,
    height: 16,
    backgroundColor: 'rgba(217,239,146,0.2)',
  },
  locationDescription: {
    minHeight: 32,
    color: '#9aa4b4',
    fontSize: 12,
    lineHeight: 17,
  },
  locationSelected: {
    color: '#f4f7ff',
  },
  suggestionsWrap: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  suggestionItem: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: 'rgba(18,22,30,0.96)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  myLocationItem: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: 'rgba(18,22,30,0.96)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217,239,146,0.25)',
  },
  myLocationText: {
    color: '#d9ef92',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  suggestionText: {
    color: '#d7deea',
    fontSize: 12,
    lineHeight: 17,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: 'rgba(18,22,30,0.96)',
  },
  loadingText: {
    color: '#b9c2d2',
    fontSize: 12,
  },
  statusRow: {
    marginTop: 2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  statusTextWrap: {
    flex: 1,
  },
  statusLabel: {
    color: '#778195',
    letterSpacing: 1.6,
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusValue: {
    color: '#b4becd',
    fontSize: 12,
    lineHeight: 17,
  },
  clearButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  clearText: {
    color: '#9099a8',
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '700',
  },
  searchButton: {
    marginTop: 4,
    borderRadius: 22,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d9ef92',
  },
  searchButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  searchButtonText: {
    color: '#0a0f14',
    fontSize: 11,
    letterSpacing: 1.3,
    fontWeight: '800',
  },
  searchButtonTextDisabled: {
    color: '#8e97a8',
  },
});
