import React, { useRef, useEffect, useState, memo } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { UrlTile, Polyline, Polygon, PROVIDER_DEFAULT, Region, MapViewProps } from 'react-native-maps';
import { Directory, Paths } from 'expo-file-system';
import { LatLng } from '../gpx/stats';

const SWISSTOPO_URL =
  'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe' +
  '/default/current/3857/{z}/{x}/{y}.jpeg';

const TILE_CACHE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

// Switzerland center
const SWITZERLAND_REGION: Region = {
  latitude: 46.8182,
  longitude: 8.2275,
  latitudeDelta: 3.5,
  longitudeDelta: 3.5,
};

// Large rectangle covering the area around Switzerland
const MASK_OUTER: LatLng[] = [
  { latitude: 50.5, longitude: 3.5 },
  { latitude: 50.5, longitude: 12.0 },
  { latitude: 44.5, longitude: 12.0 },
  { latitude: 44.5, longitude: 3.5 },
];

// Simplified Switzerland border polygon (~80 points, clockwise)
const SWITZERLAND_BORDER: LatLng[] = [
  { latitude: 47.6776, longitude: 8.5671 },
  { latitude: 47.7412, longitude: 8.7239 },
  { latitude: 47.7000, longitude: 8.8500 },
  { latitude: 47.6747, longitude: 8.9817 },
  { latitude: 47.6503, longitude: 9.1753 },
  { latitude: 47.5348, longitude: 9.5275 },
  { latitude: 47.5252, longitude: 9.6150 },
  { latitude: 47.4781, longitude: 9.6300 },
  { latitude: 47.3742, longitude: 9.5775 },
  { latitude: 47.3302, longitude: 9.4953 },
  { latitude: 47.1949, longitude: 9.5237 },
  { latitude: 47.0593, longitude: 9.4617 },
  { latitude: 47.0067, longitude: 9.5352 },
  { latitude: 46.9155, longitude: 9.5640 },
  { latitude: 46.8638, longitude: 9.4837 },
  { latitude: 46.7815, longitude: 9.5472 },
  { latitude: 46.6283, longitude: 9.4473 },
  { latitude: 46.5266, longitude: 9.6000 },
  { latitude: 46.4966, longitude: 9.7153 },
  { latitude: 46.4376, longitude: 9.7401 },
  { latitude: 46.3823, longitude: 9.9535 },
  { latitude: 46.3017, longitude: 10.0477 },
  { latitude: 46.2294, longitude: 10.1348 },
  { latitude: 46.1665, longitude: 10.1062 },
  { latitude: 46.1209, longitude: 10.2330 },
  { latitude: 46.0536, longitude: 10.2792 },
  { latitude: 45.9774, longitude: 10.1598 },
  { latitude: 45.9246, longitude: 10.0808 },
  { latitude: 45.8736, longitude: 10.0427 },
  { latitude: 45.8242, longitude: 9.9267 },
  { latitude: 45.8220, longitude: 9.7870 },
  { latitude: 45.9056, longitude: 9.6390 },
  { latitude: 45.8800, longitude: 9.4400 },
  { latitude: 45.9213, longitude: 9.2950 },
  { latitude: 45.9958, longitude: 9.0295 },
  { latitude: 46.0395, longitude: 8.9636 },
  { latitude: 46.0831, longitude: 8.8910 },
  { latitude: 46.1078, longitude: 8.7630 },
  { latitude: 46.0520, longitude: 8.5649 },
  { latitude: 45.9996, longitude: 8.4673 },
  { latitude: 46.0208, longitude: 8.3089 },
  { latitude: 46.1019, longitude: 8.2213 },
  { latitude: 46.1631, longitude: 8.1109 },
  { latitude: 46.1868, longitude: 7.9885 },
  { latitude: 46.1394, longitude: 7.8775 },
  { latitude: 46.0924, longitude: 7.7565 },
  { latitude: 46.0547, longitude: 7.6283 },
  { latitude: 45.9768, longitude: 7.4974 },
  { latitude: 45.9340, longitude: 7.2816 },
  { latitude: 45.9218, longitude: 7.1145 },
  { latitude: 46.0276, longitude: 6.9831 },
  { latitude: 46.0958, longitude: 6.9053 },
  { latitude: 46.1559, longitude: 6.8208 },
  { latitude: 46.3045, longitude: 6.7548 },
  { latitude: 46.3833, longitude: 6.6490 },
  { latitude: 46.4312, longitude: 6.4582 },
  { latitude: 46.4212, longitude: 6.3286 },
  { latitude: 46.3676, longitude: 6.2305 },
  { latitude: 46.3169, longitude: 6.0907 },
  { latitude: 46.3800, longitude: 6.0193 },
  { latitude: 46.4499, longitude: 6.0500 },
  { latitude: 46.5234, longitude: 6.1509 },
  { latitude: 46.6135, longitude: 6.1250 },
  { latitude: 46.6842, longitude: 6.1605 },
  { latitude: 46.7599, longitude: 6.1445 },
  { latitude: 46.8428, longitude: 6.1791 },
  { latitude: 46.9337, longitude: 6.2640 },
  { latitude: 47.0377, longitude: 6.3579 },
  { latitude: 47.1115, longitude: 6.4621 },
  { latitude: 47.1878, longitude: 6.5943 },
  { latitude: 47.2530, longitude: 6.7197 },
  { latitude: 47.3393, longitude: 6.8413 },
  { latitude: 47.4276, longitude: 6.9490 },
  { latitude: 47.5017, longitude: 7.0600 },
  { latitude: 47.5505, longitude: 7.1897 },
  { latitude: 47.5793, longitude: 7.3346 },
  { latitude: 47.5948, longitude: 7.5197 },
  { latitude: 47.6040, longitude: 7.6820 },
  { latitude: 47.6580, longitude: 7.7750 },
  { latitude: 47.7070, longitude: 7.9100 },
  { latitude: 47.7000, longitude: 8.1100 },
  { latitude: 47.7200, longitude: 8.2500 },
  { latitude: 47.6949, longitude: 8.4444 },
  { latitude: 47.6776, longitude: 8.5671 }, // close the ring
];

interface SwisstopoMapProps extends Omit<MapViewProps, 'provider' | 'mapType'> {
  tracks?: LatLng[][];
  onTrackPress?: (index: number) => void;
  selectedTrackIndex?: number;
  fitToTracks?: boolean;
  children?: React.ReactNode;
}

// Memoised tile layer — rebuilt only when cachePath changes to avoid iOS flicker
const TileLayer = memo(({ cachePath }: { cachePath: string | undefined }) => (
  <UrlTile
    urlTemplate={SWISSTOPO_URL}
    maximumZ={17}
    minimumZ={8}
    tileSize={256}
    zIndex={-1}
    {...(cachePath ? { tileCachePath: cachePath, tileCacheMaxAge: TILE_CACHE_MAX_AGE } : {})}
  />
));
TileLayer.displayName = 'TileLayer';

// Memoised mask — coordinates never change
const SwitzerlandMask = memo(() => (
  <Polygon
    coordinates={MASK_OUTER}
    holes={[SWITZERLAND_BORDER]}
    fillColor="#FFFFFF"
    strokeColor="transparent"
    zIndex={10}
  />
));
SwitzerlandMask.displayName = 'SwitzerlandMask';

export const SwisstopoMap = memo(function SwisstopoMap({
  tracks = [],
  onTrackPress,
  selectedTrackIndex,
  fitToTracks = false,
  style,
  children,
  ...rest
}: SwisstopoMapProps) {
  const mapRef = useRef<MapView>(null);
  const [cachePath, setCachePath] = useState<string | undefined>(undefined);

  // Set up tile cache directory once on mount
  useEffect(() => {
    try {
      const dir = new Directory(Paths.cache, 'swisstopo_tiles');
      dir.create({ intermediates: true });
      setCachePath(dir.uri);
    } catch {
      // If cache setup fails, tiles still load — just without caching
    }
  }, []);

  useEffect(() => {
    if (!fitToTracks) return;
    const allPoints = tracks.flat();
    if (allPoints.length === 0) return;

    const timeout = setTimeout(() => {
      mapRef.current?.fitToCoordinates(allPoints, {
        edgePadding: { top: 48, right: 24, bottom: 48, left: 24 },
        animated: true,
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [tracks, fitToTracks]);

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        mapType="none"
        initialRegion={SWITZERLAND_REGION}
        style={StyleSheet.absoluteFill}
        rotateEnabled={false}
        {...rest}
      >
        <TileLayer cachePath={cachePath} />
        <SwitzerlandMask />
        {tracks.map((coords, index) => (
          <Polyline
            key={index}
            coordinates={coords}
            strokeColor={index === selectedTrackIndex ? '#E63946' : '#2D6A4F'}
            strokeWidth={index === selectedTrackIndex ? 7 : 5}
            tappable={!!onTrackPress}
            onPress={() => onTrackPress?.(index)}
          />
        ))}
        {children}
      </MapView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
