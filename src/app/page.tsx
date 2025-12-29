'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import SubmitButton from '../components/submit-button';
import PickupForm from '../components/pickup-form';

const MapView = dynamic(() => import('../components/map-view'), { ssr: false });

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleButtonClick = () => {
    setIsModalOpen(true);
  };

  return (
    <div className="relative">
      <MapView />
      <div className="absolute top-4 left-4 text-white font-bold text-xl">
        30MinPickup
      </div>
      <SubmitButton onClick={handleButtonClick} />
      <PickupForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
