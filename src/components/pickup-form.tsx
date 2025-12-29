'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Upload, MapPin, Loader2, Map, Navigation } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PickupFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  status: 'loading' | 'success' | 'error';
  message: string;
}

interface LocationSuggestion {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    [key: string]: string | undefined;
  };
}

export default function PickupForm({ isOpen, onClose }: PickupFormProps) {

  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    status: 'loading',
    message: 'Acquiring location...'
  });
  const [locationMode, setLocationMode] = useState<'gps' | 'manual'>('gps');
  const [manualLocation, setManualLocation] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get geolocation when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocation({
        latitude: null,
        longitude: null,
        status: 'loading',
        message: 'Acquiring location...'
      });

      if (!navigator.geolocation) {
        setLocation({
          latitude: null,
          longitude: null,
          status: 'error',
          message: 'Geolocation is not supported by this browser'
        });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            status: 'success',
            message: 'Location acquired ✓'
          });
        },
        (error) => {
          let message = 'Location acquisition failed';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location permission denied';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information is unavailable';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out';
              break;
          }
          setLocation({
            latitude: null,
            longitude: null,
            status: 'error',
            message
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    }
  }, [isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Geocoding function using Nominatim API
  const searchLocations = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&countrycodes=`
      );
      const data = await response.json();

      const filteredSuggestions = data
        .filter((item: any) => {
          // Only show results that have city/state/country info
          const address = item.address || {};
          return address.city || address.state || address.country;
        })
        .map((item: any) => ({
          place_id: item.place_id,
          display_name: item.display_name,
          lat: item.lat,
          lon: item.lon,
          address: item.address
        }));

      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Geocoding error:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  // Debounced search
  const handleLocationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setManualLocation(value);
    setSelectedLocation(null);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      searchLocations(value);
    }, 300);
  };

  const handleLocationSelect = (suggestion: LocationSuggestion) => {
    const address = suggestion.address || {};

    // Handle different city field names from Nominatim API
    const city = address.city || address.town || address.village || address.municipality ||
                 address.hamlet || address.suburb || address.neighbourhood || address.locality;

    // Handle different state/province field names
    const state = address.state || address.province || address.region;

    const locationString = [
      city,
      state,
      address.country
    ].filter(Boolean).join(', ');

    setManualLocation(locationString);
    setSelectedLocation(suggestion);
    setShowSuggestions(false);
    setLocation({
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon),
      status: 'success',
      message: 'Location selected ✓'
    });
  };

  const handleLocationModeChange = (mode: 'gps' | 'manual') => {
    setLocationMode(mode);
    if (mode === 'manual') {
      setLocation({
        latitude: null,
        longitude: null,
        status: 'error',
        message: 'Please select a location'
      });
      setManualLocation('');
      setSelectedLocation(null);
      setShowSuggestions(false);
    } else {
      // Reset to GPS mode
      setLocation({
        latitude: null,
        longitude: null,
        status: 'loading',
        message: 'Acquiring location...'
      });

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              status: 'success',
              message: 'Location acquired ✓'
            });
          },
          (error) => {
            let message = 'Location acquisition failed';
            switch (error.code) {
              case error.PERMISSION_DENIED:
                message = 'Location permission denied';
                break;
              case error.POSITION_UNAVAILABLE:
                message = 'Location information is unavailable';
                break;
              case error.TIMEOUT:
                message = 'Location request timed out';
                break;
            }
            setLocation({
              latitude: null,
              longitude: null,
              status: 'error',
              message
            });
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
          }
        );
      }
    }
  };

  const handleSubmit = async () => {
    // Check if image is selected
    if (!image) {
      alert('Please select an image before submitting.');
      return;
    }

    // Check if location is available
    if (!location.latitude || !location.longitude) {
      alert('Please provide a location before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (!supabase) {
        throw new Error('Supabase client not available. Please check your environment configuration.');
      }

      // Create unique filename with sanitized original name
      const timestamp = Date.now();
      const sanitizedName = image.name
        .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
        .replace(/_{2,}/g, '_') // Replace multiple underscores with single
        .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
      const fileName = `${timestamp}_${sanitizedName}`;
      const filePath = `pickups/${fileName}`;

      // Upload image to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pickup-photos')
        .upload(filePath, image);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('pickup-photos')
        .getPublicUrl(filePath);

      const photoUrl = urlData.publicUrl;

      // Insert into pickups table
      const { error: insertError } = await supabase
        .from('pickups')
        .insert({
          description,
          latitude: location.latitude!,
          longitude: location.longitude!,
          photo_url: photoUrl,
          status: 'pending'
        } as any);

      if (insertError) {
        throw new Error(`Database insert failed: ${insertError.message}`);
      }

      // Success
      alert('Pickup submitted successfully! It will be reviewed before appearing on the map.');

      // Reset form
      setImage(null);
      setImagePreview(null);
      setDescription('');
      setLocation({
        latitude: null,
        longitude: null,
        status: 'loading',
        message: 'Acquiring location...'
      });
      setLocationMode('gps');
      setManualLocation('');
      setSelectedLocation(null);
      setSuggestions([]);
      setShowSuggestions(false);

      onClose();

    } catch (error) {
      console.error('Submission error:', error);
      alert(`Failed to submit pickup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setImage(null);
    setImagePreview(null);
    setDescription('');
    setLocation({
      latitude: null,
      longitude: null,
      status: 'loading',
      message: 'Acquiring location...'
    });
    setLocationMode('gps');
    setManualLocation('');
    setSelectedLocation(null);
    setSuggestions([]);
    setShowSuggestions(false);
    onClose();
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleClose} />

      {/* Modal Card */}
      <div className="relative bg-gray-900 text-white rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Submit Pickup</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-800 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Photo Upload */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Photo</label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-green-500 transition-colors"
          >
            {imagePreview ? (
              <div className="space-y-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded"
                />
                <p className="text-sm text-gray-400">Click to change image</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 mx-auto text-gray-400" />
                <p className="text-sm">Click to upload</p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the pickup location..."
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg resize-none focus:border-green-500 focus:outline-none"
            rows={3}
          />
        </div>

        {/* Location */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Location</label>

          {/* Location Mode Toggle */}
          <div className="flex space-x-2 mb-3">
            <button
              type="button"
              onClick={() => handleLocationModeChange('gps')}
              className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                locationMode === 'gps'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Navigation className="w-4 h-4" />
              <span>GPS</span>
            </button>
            <button
              type="button"
              onClick={() => handleLocationModeChange('manual')}
              className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                locationMode === 'manual'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Map className="w-4 h-4" />
              <span>Manual</span>
            </button>
          </div>

          {locationMode === 'gps' ? (
            /* GPS Location Status */
            <div className="flex items-center space-x-2 p-3 bg-gray-800 border border-gray-700 rounded-lg">
              <MapPin className="w-4 h-4" />
              {location.status === 'loading' && (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">{location.message}</span>
                </div>
              )}
              {location.status === 'success' && (
                <span className="text-sm text-green-400">{location.message}</span>
              )}
              {location.status === 'error' && (
                <span className="text-sm text-red-400">{location.message}</span>
              )}
            </div>
          ) : (
            /* Manual Location Input */
            <div className="relative">
              <input
                ref={locationInputRef}
                type="text"
                value={manualLocation}
                onChange={handleLocationInputChange}
                placeholder="Enter city, state, country..."
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-green-500 focus:outline-none"
              />

              {/* Autocomplete Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {suggestions.map((suggestion) => {
                    const address = suggestion.address || {};

                    // Handle different city field names from Nominatim API
                    const city = address.city || address.town || address.village || address.municipality ||
                                 address.hamlet || address.suburb || address.neighbourhood || address.locality;

                    // Handle different state/province field names
                    const state = address.state || address.province || address.region;

                    const displayText = [
                      city,
                      state,
                      address.country
                    ].filter(Boolean).join(', ');

                    return (
                      <button
                        key={suggestion.place_id}
                        type="button"
                        onClick={() => handleLocationSelect(suggestion)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-700 transition-colors border-b border-gray-600 last:border-b-0"
                      >
                        <div className="text-sm text-white">{displayText}</div>
                        <div className="text-xs text-gray-400 truncate">{suggestion.display_name}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || location.status === 'loading' || location.status === 'error' || !image}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <span>Submit Pickup</span>
          )}
        </button>
      </div>
    </div>
  );
}
