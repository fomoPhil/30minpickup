'use client';

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/lib/supabase';
import PickupList from './pickup-list';
import ImageLightbox from './image-lightbox';

// Dynamically import MarkerClusterGroup to avoid SSR issues
const MarkerClusterGroup = dynamic(() => import('react-leaflet-cluster'), {
  ssr: false,
  loading: () => <div>Loading clusters...</div>
});

interface Pickup {
  id: string;
  latitude: number;
  longitude: number;
  description: string;
  photo_url: string;
  status: string;
}

// Custom marker icon
const customIcon = L.divIcon({
  html: '<div class="w-4 h-4 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e] border-2 border-white"></div>',
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Custom cluster icon
const createClusterCustomIcon = (cluster: any) => {
  return L.divIcon({
    html: `<div style="background-color: white; border: 2px solid green; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: green;">${cluster.getChildCount()}</div>`,
    className: 'custom-cluster-icon',
    iconSize: L.point(40, 40),
  });
};

export default function MapView() {
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [visiblePickups, setVisiblePickups] = useState<Pickup[]>([]);
  const [isListOpen, setIsListOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRefs = useRef(new Map<string, L.Marker>());

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
        setVisiblePickups(data || []);
      } catch (error) {
        console.error('Error fetching pickups:', error);
      }
    };

    fetchApprovedPickups();
  }, []);

  function MapEvents({ pickups, setVisiblePickups }: { pickups: Pickup[], setVisiblePickups: (p: Pickup[]) => void }) {
    const map = useMap();

    useMapEvents({
      moveend: () => {
        const bounds = map.getBounds();
        const visible = pickups.filter(p => bounds.contains([p.latitude, p.longitude]));
        setVisiblePickups(visible);
      },
      zoomend: () => {
        const bounds = map.getBounds();
        const visible = pickups.filter(p => bounds.contains([p.latitude, p.longitude]));
        setVisiblePickups(visible);
      }
    });

    return null;
  }

  return (
    <>
      <MapContainer ref={mapRef} center={[39.8283, -98.5795]} zoom={4} style={{ height: '100vh', width: '100vw' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents pickups={pickups} setVisiblePickups={setVisiblePickups} />
        <button
          onClick={() => setIsListOpen(!isListOpen)}
          className="absolute top-4 right-4 z-[1000] bg-black/80 text-white px-4 py-2 rounded-md"
        >
          {isListOpen ? 'Hide List' : 'Show List'}
        </button>
        <MarkerClusterGroup iconCreateFunction={createClusterCustomIcon}>
          {pickups.map((pickup) => (
            <Marker
              key={pickup.id}
              ref={(ref) => { if (ref) markerRefs.current.set(pickup.id, ref); }}
              position={[pickup.latitude, pickup.longitude] as [number, number]}
              icon={customIcon}
            >
              <Popup>
                <div>
                  <p>{pickup.description}</p>
                  <img
                    src={pickup.photo_url}
                    alt="Pickup"
                    className="w-32 h-32 object-cover mt-2 rounded-md cursor-zoom-in"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(pickup.photo_url);
                    }}
                  />
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
        <PickupList visiblePickups={visiblePickups} markerRefs={markerRefs} mapRef={mapRef} isListOpen={isListOpen} />
      </MapContainer>
      <ImageLightbox isOpen={!!selectedImage} onClose={() => setSelectedImage(null)} imageUrl={selectedImage} />
    </>
  );
}
