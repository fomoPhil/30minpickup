'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Check, X, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Pickup {
  id: string;
  created_at: string;
  latitude: number;
  longitude: number;
  description: string;
  photo_url: string;
  status: string;
}

export default function AdminDashboard() {
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingPickups = async () => {
    if (!supabase) {
      console.error('Supabase client not available');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pickups')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPickups(data || []);
    } catch (error) {
      console.error('Error fetching pickups:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePickupStatus = async (id: string, status: 'approved' | 'rejected') => {
    if (!supabase) {
      console.error('Supabase client not available');
      return;
    }

    try {
      const { error } = await (supabase
        .from('pickups') as any)
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      // Remove from local state
      setPickups(prev => prev.filter(pickup => pickup.id !== id));
    } catch (error) {
      console.error('Error updating pickup:', error);
      // Could add toast notification here
    }
  };

  useEffect(() => {
    fetchPendingPickups();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading pending pickups...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <button
            onClick={fetchPendingPickups}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {pickups.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-xl">No pending pickups to review</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pickups.map((pickup) => (
              <div key={pickup.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                <div className="aspect-video relative">
                  <Image
                    src={pickup.photo_url}
                    alt="Pickup photo"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <p className="text-gray-300 text-sm mb-2">
                    {formatDate(pickup.created_at)}
                  </p>
                  <p className="text-white mb-4 line-clamp-3">
                    {pickup.description}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updatePickupStatus(pickup.id, 'approved')}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => updatePickupStatus(pickup.id, 'rejected')}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
