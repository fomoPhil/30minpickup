'use client';

import { Plus } from 'lucide-react';

interface SubmitButtonProps {
  onClick: () => void;
}

export default function SubmitButton({ onClick }: SubmitButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-[1000] w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
      aria-label="Submit pickup"
    >
      <Plus className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-200" />
    </button>
  );
}
