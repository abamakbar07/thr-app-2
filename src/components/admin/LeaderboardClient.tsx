'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/Skeleton';

// Define the participant score interface
interface ParticipantScore {
  id: string;
  name: string;
  displayName: string;
  avatar: string | null;
  score: number;
  correctAnswers: number;
  lastAnsweredAt: number | null;
}

interface LeaderboardClientProps {
  initialData: ParticipantScore[];
  roomId: string;
  updateIntervalMs: number;
}

export default function LeaderboardClient({ 
  initialData, 
  roomId, 
  updateIntervalMs 
}: LeaderboardClientProps) {
  const [participants, setParticipants] = useState<ParticipantScore[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  useEffect(() => {
    // Function to fetch updated leaderboard data
    const fetchLeaderboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/rooms/${roomId}/leaderboard`);
        
        if (response.ok) {
          const data = await response.json();
          
          // Process and sort the data
          if (data && data.participants && Array.isArray(data.participants)) {
            const processedData = data.participants.map((p: any) => ({
              id: p._id || p.id,
              name: p.name || 'Unknown',
              displayName: p.displayName || p.name || 'Unknown',
              avatar: p.avatar || null,
              score: p.totalRupiah || p.score || 0,
              correctAnswers: p.correctAnswers || 0,
              lastAnsweredAt: p.lastAnsweredAt || null
            }));
            
            // Sort by score (descending) and then by last answered time
            const sortedData = processedData.sort((a: ParticipantScore, b: ParticipantScore) => {
              if (b.score !== a.score) return b.score - a.score;
              if (a.lastAnsweredAt && b.lastAnsweredAt) {
                return a.lastAnsweredAt - b.lastAnsweredAt;
              }
              return 0;
            });
            
            setParticipants(sortedData);
          }
          setLastUpdated(new Date());
        }
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    // Initial fetch
    fetchLeaderboardData();
    
    // Set up polling interval
    const intervalId = setInterval(fetchLeaderboardData, updateIntervalMs);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [roomId, updateIntervalMs]);
  
  return (
    <div className="px-4 py-5 sm:p-6">
      <div className="sm:flex sm:items-center sm:justify-between mb-4">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Participant Rankings
        </h3>
        <div className="mt-3 sm:mt-0 text-sm text-gray-500 flex items-center">
          {loading && (
            <div className="flex items-center">
              <Skeleton className="h-4 w-4 mr-2 rounded-full" />
              <span>Updating...</span>
            </div>
          )}
          {!loading && (
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          )}
        </div>
      </div>
      
      {participants.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Participant
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Correct Answers
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {participants.map((participant, index) => {
                // Add styling for top 3 ranks
                let rankClass = '';
                if (index === 0) rankClass = 'bg-yellow-50 text-yellow-800';
                else if (index === 1) rankClass = 'bg-gray-50 text-gray-800';
                else if (index === 2) rankClass = 'bg-amber-50 text-amber-800';
                
                return (
                  <tr key={participant.id} className={rankClass}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center">
                        <span className="font-bold">{index + 1}</span>
                        {index < 3 && (
                          <span className="ml-2">
                            {index === 0 && '🥇'}
                            {index === 1 && '🥈'}
                            {index === 2 && '🥉'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {participant.avatar ? (
                          <div className="flex-shrink-0 h-10 w-10 relative">
                            <Image
                              src={participant.avatar}
                              alt={participant.displayName}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-indigo-800">
                              {participant.displayName.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {participant.displayName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{participant.score}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {participant.correctAnswers}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No participants yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            The leaderboard will update when participants join and answer questions.
          </p>
        </div>
      )}
    </div>
  );
} 