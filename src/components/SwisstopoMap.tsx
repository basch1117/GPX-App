import React, { useRef, useEffect, memo } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { UrlTile, Polyline, PROVIDER_DEFAULT, Region, MapViewProps } from 'react-native-maps';
import { LatLng, computeBounds } from '../gpx/stats';

const SWISSTOPO_URL =
  'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe' +
  '/default/current/3857/{z}/{x}/{y}.jpeg';

// Switzerland center
const SWITZERLAND_REGION: Region = {
  latitude: 46.8182,
  longitude: 8.2275,
  latitudeDelta: 3.5,
  longitudeDelta: 3.5,
};

interface SwisstopoMapProps extends Omit<MapViewProps, 'provider' | 'mapType'> {
  tracks?: LatLng[][];
  onTrackPress?: (index: number) => void;
  selectedTrackIndex?: number;
  fitToTracks?: boolean;
  children?: React.ReactNode;
}

const TileLayer = memo(() => (
  <UrlTile
    urlTemplate={SWISSTOPO_URL}
    maximumZ={17}
    minimumZ={8}
    tileSize={256}
    zIndex={-1}
  />
));
TileLayer.displayName = 'TileLayer';

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
        <TileLayer />
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
    backgroundColor: '#e8e0d8',
  },
});
