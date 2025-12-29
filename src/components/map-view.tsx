'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/lib/supabase';

interface Pickup {
  id: string;
  latitude: number;
  longitude: number;
  description: string;
  photo_url: string;
  status: string;
}

// Custom icon
const customIcon = L.divIcon({
  html: '<div class="w-4 h-4 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e] border-2 border-white"></div>',
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export default function MapView() {
  const [pickups, setPickups] = useState<Pickup[]>([]);

  useEffect(() => {
    const fetchApprovedPickups = async () => {
      if (!supabase) {
        console.error('Supabase client not available');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('pickups')
          .select('*')
          .eq('status', 'approved');

        if (error) throw error;
        setPickups(data || []);
      } catch (error) {
        console.error('Error fetching pickups:', error);
      }
    };

    fetchApprovedPickups();
  }, []);

  return (
    <MapContainer center={[39.8283, -98.5795]} zoom={4} style={{ height: '100vh', width: '100vw' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pickups.map((pickup) => (
        <Marker
          key={pickup.id}
          position={[pickup.latitude, pickup.longitude] as [number, number]}
          icon={customIcon}
        />
      ))}
    </MapContainer>
  );
}
