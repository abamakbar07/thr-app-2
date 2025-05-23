'use client';

import { useEffect, useState } from 'react';
import { LeaderboardSkeleton } from '@/components/ui/Skeleton';

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
      console.log(`Fetching leaderboard for room ${roomId}`);
      const response = await fetch(`/api/rooms/${roomId}/leaderboard`);
      
      if (!response.ok) {
        console.error('Failed response:', response.status, response.statusText);
        throw new Error(`Failed to fetch leaderboard data: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
      // Make sure we have data
      if (!data || !data.participants || !Array.isArray(data.participants)) {
        console.error('Invalid data format:', data);
        setError('Invalid data format received');
        setIsLoading(false);
        return;
      }
      
      console.log(`Found ${data.participants.length} participants`);
      
      // Ensure all participants have totalRupiah property
      const validParticipants = data.participants.map((p: any) => ({
        _id: p._id || p.id || '',
        name: p.name || 'Unknown',
        totalRupiah: p.totalRupiah || p.score || 0,
        avatar: p.avatar || null,
        correctAnswers: p.correctAnswers || 0
      }));
      
      // Sort and add position
      const sortedParticipants = validParticipants
        .sort((a: any, b: any) => b.totalRupiah - a.totalRupiah)
        .map((p: any, index: number) => ({
          ...p,
          position: index + 1
        }));
      
      console.log('Processed participants:', sortedParticipants);
      setParticipants(sortedParticipants);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setError('Failed to load leaderboard data');
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    console.log('Leaderboard component mounted with roomId:', roomId);
    fetchLeaderboard();
    
    // Set up polling for leaderboard updates
    const intervalId = setInterval(fetchLeaderboard, refreshInterval);
    
    return () => {
      console.log('Cleaning up leaderboard component');
      clearInterval(intervalId);
    };
  }, [roomId, refreshInterval]);
  
  // Get current participant's position
  const currentParticipant = participants.find(p => p._id === currentParticipantId);
  
  if (isLoading) {
    return <LeaderboardSkeleton />;
  }
  
  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4 text-center">Leaderboard</h2>
        <p className="text-red-500 text-center">{error}</p>
        <button 
          onClick={fetchLeaderboard}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md w-full"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  // Get top 10 participants
  const topParticipants = participants.slice(0, 10);
  
  // Get the appropriate medal for top positions
  const getMedalEmoji = (position: number) => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈'; 
      case 3: return '🥉';
      default: return null;
    }
  };
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-200">
      <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Leaderboard</h2>
      
      {/* Current participant position */}
      {currentParticipant && currentParticipant.position && (
        <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-lg">
          <p className="text-center font-medium">
            <span className="block text-sm text-green-700 mb-1">Your Position</span>
            <span className="text-2xl text-green-800 font-bold">
              {currentParticipant.position} <span className="text-sm">of {participants.length}</span>
            </span>
          </p>
          <p className="text-center text-green-700 mt-1 font-medium">
            Total: {currentParticipant.totalRupiah} rupiah
          </p>
        </div>
      )}
      
      {/* Top participants */}
      <div className="space-y-3">
        {topParticipants.length > 0 ? (
          topParticipants.map((participant) => {
            const position = participant.position || 0;
            const medal = getMedalEmoji(position);
            const isCurrentUser = participant._id === currentParticipantId;
            const bgColor = isCurrentUser ? 'bg-blue-50' : 
                            position <= 3 ? 'bg-yellow-50' : 'bg-gray-50';
            const borderColor = isCurrentUser ? 'border-blue-200' : 
                              position <= 3 ? 'border-yellow-200' : 'border-gray-200';
            
            return (
              <div
                key={participant._id}
                className={`flex items-center p-4 rounded-lg border ${bgColor} ${borderColor} transition-all duration-200 hover:shadow-md`}
              >
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full mr-3 font-bold text-lg">
                  {medal ? (
                    <span className="text-xl">{medal}</span>
                  ) : (
                    <div className="bg-gray-200 w-full h-full rounded-full flex items-center justify-center text-gray-700">
                      {position}
                    </div>
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  <p className="font-medium text-gray-800 truncate">
                    {participant.name}
                    {isCurrentUser && (
                      <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">You</span>
                    )}
                  </p>
                </div>
                <div className="flex-shrink-0 font-bold text-green-600">
                  {participant.totalRupiah} rupiah
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-2">No participants yet</p>
            <p className="text-sm text-gray-400">Be the first one to answer questions!</p>
          </div>
        )}
      </div>
    </div>
  );
} 