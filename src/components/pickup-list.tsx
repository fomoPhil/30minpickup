'use client';

import { useRef } from 'react';
import L from 'leaflet';

interface Pickup {
  id: string;
  latitude: number;
  longitude: number;
  description: string;
  photo_url: string;
  status: string;
}

interface PickupListProps {
  visiblePickups: Pickup[];
  markerRefs: React.MutableRefObject<Map<string, L.Marker>>;
  mapRef: React.MutableRefObject<L.Map | null>;
  isListOpen: boolean;
}

export default function PickupList({ visiblePickups, markerRefs, mapRef, isListOpen }: PickupListProps) {
  const handleFlyTo = (pickup: Pickup) => {
    if (mapRef.current) {
      mapRef.current.flyTo([pickup.latitude, pickup.longitude], 15);
      const marker = markerRefs.current.get(pickup.id);
      if (marker) {
        marker.openPopup();
      }
    }
  };

  if (!isListOpen || visiblePickups.length === 0) return null;

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="absolute left-4 top-4 bottom-4 w-80 bg-black/80 backdrop-blur-md rounded-lg overflow-y-auto z-[1000] md:block hidden">
        <div className="p-4">
          <h3 className="text-white text-lg font-bold mb-4">Visible Pickups</h3>
          {visiblePickups.map((pickup) => (
            <div key={pickup.id} className="flex items-center gap-3 p-3 border-b border-gray-700 last:border-b-0">
              <img
                src={pickup.photo_url}
                alt="Pickup"
                className="w-12 h-12 rounded object-cover"
              />
              <div className="flex-1 text-white">
                <p className="text-sm font-medium">{pickup.description || 'Pickup'}</p>
              </div>
              <button
                onClick={() => handleFlyTo(pickup)}
                className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
              >
                Fly To
              </button>
            </div>
          ))}
        </div>
      </div>
      {/* Mobile Drawer */}
      <div className="absolute bottom-0 left-0 right-0 h-96 bg-black/80 backdrop-blur-md rounded-t-lg overflow-y-auto z-[1000] md:hidden">
        <div className="p-4">
          <h3 className="text-white text-lg font-bold mb-4">Visible Pickups</h3>
          {visiblePickups.map((pickup) => (
            <div key={pickup.id} className="flex items-center gap-3 p-3 border-b border-gray-700 last:border-b-0">
              <img
                src={pickup.photo_url}
                alt="Pickup"
                className="w-12 h-12 rounded object-cover"
              />
              <div className="flex-1 text-white">
                <p className="text-sm font-medium">{pickup.description || 'Pickup'}</p>
              </div>
              <button
                onClick={() => handleFlyTo(pickup)}
                className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
              >
                Fly To
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
