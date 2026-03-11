'use client';
import React, { useState } from 'react';
import MoodRingAvatar from './MoodRingAvatar';
import { MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

// All connections with their locations (mock + from circle data)
const LOCATION_DATA = [
  { name: 'Farid Azman', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop', mood: 'energised', city: 'Tokyo', country: 'Japan' },
  { name: 'Zara Malik', avatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=200&h=200&fit=crop', mood: 'calm', city: 'Georgetown', country: 'Malaysia' },
  { name: 'Daniel Tan', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop', mood: 'motivated', city: 'Kuala Lumpur', country: 'Malaysia' },
  { name: 'Jane Chia', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop', mood: 'loving', city: 'Kuala Lumpur', country: 'Malaysia' },
  { name: 'Amira Yusof', avatar: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=200&h=200&fit=crop', mood: 'calm', city: 'Georgetown', country: 'Malaysia' },
  { name: 'Nurul Hashim', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop', mood: 'happy', city: 'Penang', country: 'Malaysia' },
  { name: 'Haji Hashim', avatar: 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=200&h=200&fit=crop', mood: 'calm', city: 'Penang', country: 'Malaysia' },
];

function groupByCity(data) {
  const map = {};
  data.forEach(p => {
    const key = `${p.city}, ${p.country}`;
    if (!map[key]) map[key] = [];
    map[key].push(p);
  });
  return map;
}

export default function LocationsTab() {
  const grouped = groupByCity(LOCATION_DATA);
  const cities = Object.keys(grouped);
  const [selectedCity, setSelectedCity] = useState(null);

  const { data: profiles = [] } = useQuery({
    queryKey: ['user_profiles'],
    queryFn: () => base44.entities.UserProfile.list(),
  });

  // Get the current user's city from their profile
  const userCurrentLocation = profiles[0]?.current_location || '';
  // Match against city keys (e.g. "Kuala Lumpur" matches "Kuala Lumpur, Malaysia")
  const userCityKey = cities.find(c => userCurrentLocation && c.toLowerCase().startsWith(userCurrentLocation.toLowerCase()));
  const activeCity = selectedCity || userCityKey || cities[0];

  return (
    <div className="space-y-3">
      {/* City pill filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {cities.map(city => (
          <button
            key={city}
            onClick={() => setSelectedCity(city)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeCity === city
                ? 'bg-[#1A1A2E] text-white'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            <MapPin className="w-3 h-3" />
            {city}
            <span className={`text-[10px] ${activeCity === city ? 'text-white/70' : 'text-gray-400'}`}>
              {grouped[city].length}
            </span>
          </button>
        ))}
      </div>

      {/* People in selected city */}
      <div className="bg-white rounded-xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs font-semibold text-[#111111]">{activeCity}</span>
          {activeCity === userCityKey && (
            <span className="text-[10px] bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full font-medium">Your city</span>
          )}
        </div>
        <div className="space-y-3">
          {(grouped[activeCity] || []).map((p, i) => (
            <div key={i} className="flex items-center gap-3">
              <MoodRingAvatar src={p.avatar} mood={p.mood} size={36} name={p.name} />
              <div>
                <p className="text-sm font-medium text-[#111111]">{p.name}</p>
                <p className="text-xs text-gray-400 capitalize">{p.mood?.replace('_', ' ')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}