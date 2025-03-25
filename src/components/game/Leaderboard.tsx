'use client';

import { useEffect, useState } from 'react';

interface LeaderboardParticipant {
  _id: string;
  name: string;
  totalRupiah: number;
  position?: number;
}

interface LeaderboardProps {
  roomId: string;
  currentParticipantId: string;
  refreshInterval?: number;
}

export function Leaderboard({ roomId, currentParticipantId, refreshInterval = 10000 }: LeaderboardProps) {
  const [participants, setParticipants] = useState<LeaderboardParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`/api/rooms/${roomId}/leaderboard`);
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard data');
      }
      
      const data = await response.json();
      
      // Sort by rupiah and add position
      const sortedParticipants = data.participants
        .sort((a: LeaderboardParticipant, b: LeaderboardParticipant) => b.totalRupiah - a.totalRupiah)
        .map((p: LeaderboardParticipant, index: number) => ({
          ...p,
          position: index + 1
        }));
      
      setParticipants(sortedParticipants);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setError('Failed to load leaderboard');
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchLeaderboard();
    
    // Set up polling for leaderboard updates
    const intervalId = setInterval(fetchLeaderboard, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [roomId, refreshInterval]);
  
  // Get current participant's position
  const currentParticipant = participants.find(p => p._id === currentParticipantId);
  
  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4 text-center">Leaderboard</h2>
        <div className="flex justify-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4 text-center">Leaderboard</h2>
        <p className="text-red-500 text-center">{error}</p>
      </div>
    );
  }
  
  // Get top 10 participants
  const topParticipants = participants.slice(0, 10);
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 text-center">Leaderboard</h2>
      
      {/* Current participant position */}
      {currentParticipant && (
        <div className="mb-6 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
          <p className="text-center text-sm text-emerald-800 font-medium">
            Your position: {currentParticipant.position} of {participants.length}
          </p>
        </div>
      )}
      
      {/* Top participants */}
      <div className="space-y-2">
        {topParticipants.map((participant) => (
          <div
            key={participant._id}
            className={`flex items-center p-3 rounded-md ${
              participant._id === currentParticipantId
                ? 'bg-blue-50 border border-blue-100'
                : 'bg-gray-50'
            }`}
          >
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 mr-3">
              {participant.position}
            </div>
            <div className="flex-grow min-w-0">
              <p className="font-medium truncate">
                {participant.name}
                {participant._id === currentParticipantId && (
                  <span className="ml-1 text-xs text-blue-600">(You)</span>
                )}
              </p>
            </div>
            <div className="flex-shrink-0 font-bold text-emerald-600">
              {participant.totalRupiah} rupiah
            </div>
          </div>
        ))}
        
        {participants.length === 0 && (
          <p className="text-center text-gray-500 py-4">No participants yet</p>
        )}
      </div>
    </div>
  );
} 