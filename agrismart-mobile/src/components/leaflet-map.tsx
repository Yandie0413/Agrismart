import { useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

export type MapPoint = {
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  superficie?: number;
};

export type MapZone = {
  latitude: number;
  longitude: number;
  count: number;
  label?: string;
};

type LeafletMapProps = {
  points?: MapPoint[];
  zones?: MapZone[];
  pickMode?: boolean;
  initialPosition?: { latitude: number; longitude: number };
  onPick?: (coords: { latitude: number; longitude: number }) => void;
  height?: number;
};

const MADAGASCAR_CENTER = { latitude: -18.8792, longitude: 47.5079 };

function buildHtml(
  points: MapPoint[],
  zones: MapZone[],
  pickMode: boolean,
  center: { latitude: number; longitude: number },
  zoom: number
) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map').setView([${center.latitude}, ${center.longitude}], ${zoom});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const points = ${JSON.stringify(points)};
    const zones = ${JSON.stringify(zones)};
    const pickMode = ${pickMode};
    let pickedMarker = null;

    points.forEach(function (p) {
      const marker = L.marker([p.latitude, p.longitude]).addTo(map);
      if (p.title) {
        marker.bindPopup('<b>' + p.title + '</b>' + (p.description ? '<br/>' + p.description : ''));
      }
      // Vue de parcelle : cercle approximatif proportionnel a la superficie (en ares)
      if (p.superficie && p.superficie > 0) {
        const rayonMetres = Math.min(500, Math.max(15, Math.sqrt((p.superficie * 100) / Math.PI)));
        L.circle([p.latitude, p.longitude], {
          radius: rayonMetres,
          color: '#2D6A4F',
          weight: 1.5,
          fillColor: '#4ADE80',
          fillOpacity: 0.25
        }).addTo(map);
      }
    });

    const maxCount = zones.reduce(function (max, z) { return Math.max(max, z.count); }, 1);
    zones.forEach(function (z) {
      const rayon = 15000 + (z.count / maxCount) * 35000;
      const intensite = 0.15 + (z.count / maxCount) * 0.35;
      const cercle = L.circle([z.latitude, z.longitude], {
        radius: rayon,
        color: '#4ADE80',
        weight: 1,
        fillColor: '#4ADE80',
        fillOpacity: intensite
      }).addTo(map);
      cercle.bindPopup('<b>' + (z.label || 'Zone agricole') + '</b><br/>' + z.count + ' exploitation(s)');
    });

    if (pickMode) {
      map.on('click', function (e) {
        if (pickedMarker) map.removeLayer(pickedMarker);
        pickedMarker = L.marker(e.latlng).addTo(map);
        window.ReactNativeWebView.postMessage(JSON.stringify({
          latitude: e.latlng.lat,
          longitude: e.latlng.lng
        }));
      });
    }
  </script>
</body>
</html>
`;
}

export default function LeafletMap({
  points = [],
  zones = [],
  pickMode = false,
  initialPosition,
  onPick,
  height = 260,
}: LeafletMapProps) {
  const webviewRef = useRef<WebView>(null);
  const center = initialPosition || (points[0] ? { latitude: points[0].latitude, longitude: points[0].longitude } : MADAGASCAR_CENTER);
  const zoom = initialPosition || points.length > 0 ? 13 : 6;

  const html = useMemo(
    () => buildHtml(points, zones, pickMode, center, zoom),
    [points, zones, pickMode, center.latitude, center.longitude, zoom]
  );

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        source={{ html }}
        style={styles.webview}
        onMessage={(event) => {
          if (!onPick) return;
          try {
            const data = JSON.parse(event.nativeEvent.data);
            onPick({ latitude: data.latitude, longitude: data.longitude });
          } catch {
            // ignore malformed message
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', borderRadius: 16, overflow: 'hidden' },
  webview: { flex: 1, backgroundColor: 'transparent' },
});
