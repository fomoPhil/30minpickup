'use client';

import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Dummy pickups: 5 locations (lat, lng)
const DUMMY_PICKUPS = [
  [40.7128, -74.0060], // New York
  [34.0522, -118.2437], // LA
  [41.8781, -87.6298], // Chicago
  [29.7604, -95.3698], // Houston
  [33.4484, -112.0740], // Phoenix
];

// Custom icon
const customIcon = L.divIcon({
  html: '<div class="w-4 h-4 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e] border-2 border-white"></div>',
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export default function MapView() {
  return (
    <MapContainer center={[39.8283, -98.5795]} zoom={4} style={{ height: '100vh', width: '100vw' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {DUMMY_PICKUPS.map((pos, index) => (
        <Marker key={index} position={pos as [number, number]} icon={customIcon} />
      ))}
    </MapContainer>
  );
}
