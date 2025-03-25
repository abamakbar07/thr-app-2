'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Participant {
  id: string;
  name: string;
  roomId: string;
  roomName: string;
}

export default function GameRoom() {
  const params = useParams();
  const router = useRouter();
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const roomId = params.roomId as string;

  useEffect(() => {
    // Check if participant info exists in localStorage
    const storedParticipant = localStorage.getItem('participant');
    
    if (!storedParticipant) {
      // Redirect to join page if not
      router.push('/join');
      return;
    }

    const parsedParticipant = JSON.parse(storedParticipant) as Participant;
    
    // Verify this participant belongs to this room
    if (parsedParticipant.roomId !== roomId) {
      router.push('/join');
      return;
    }

    setParticipant(parsedParticipant);
    setLoading(false);

    // Redirect to play page
    router.push(`/play/${roomId}?pid=${parsedParticipant.id}`);
  }, [roomId, router]);

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

  return null;
} 