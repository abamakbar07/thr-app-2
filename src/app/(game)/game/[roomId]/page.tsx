'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Participant {
  id: string;
  name: string;
  roomId: string;
  roomName: string;
  accessCode: string;
}

export default function GameRoom() {
  const params = useParams();
  const router = useRouter();
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const roomId = params.roomId as string;

  useEffect(() => {
    const handleNavigation = async () => {
      try {
        // Check if participant info exists in localStorage
        const storedParticipant = localStorage.getItem('participant');
        
        if (!storedParticipant) {
          // Redirect to join page if not
          router.push('/join');
          return;
        }

        // Parse the participant data
        let parsedParticipant: Participant;
        try {
          parsedParticipant = JSON.parse(storedParticipant) as Participant;
        } catch (e) {
          // Invalid JSON in localStorage
          console.error('Invalid participant data in localStorage:', e);
          localStorage.removeItem('participant');
          router.push('/join');
          return;
        }
        
        // Verify this participant belongs to this room
        if (!parsedParticipant.id || !parsedParticipant.roomId || parsedParticipant.roomId !== roomId) {
          console.warn('Participant does not belong to this room or has invalid data');
          router.push('/join');
          return;
        }

        // Set participant in state
        setParticipant(parsedParticipant);
        setLoading(false);
        
        // Redirect to play page with participant ID
        setTimeout(() => {
          router.push(`/play/${roomId}?pid=${parsedParticipant.id}`);
        }, 100);
      } catch (err) {
        console.error('Error in game room navigation:', err);
        setError('An error occurred while joining the game. Please try again.');
        setLoading(false);
      }
    };

    handleNavigation();
  }, [roomId, router]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/join" className="inline-block w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 text-center">
            Go to Join Page
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to game...</p>
      </div>
    </div>
  );
} 