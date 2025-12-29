'use client';

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
}

export default function ImageLightbox({ isOpen, onClose, imageUrl }: ImageLightboxProps) {
  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999] cursor-pointer"
      onClick={onClose}
    >
      <img
        src={imageUrl}
        alt="Pickup"
        className="max-h-screen max-w-screen object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-4xl font-bold hover:text-gray-300"
      >
        ×
      </button>
    </div>
  );
}
