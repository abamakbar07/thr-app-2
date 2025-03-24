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

  return (
    <div className="min-h-screen bg-emerald-50 p-4">
      <header className="bg-white shadow-md rounded-lg mb-6 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">{participant?.roomName}</h1>
            <p className="text-sm text-gray-500">Welcome, {participant?.name}</p>
          </div>
          <Link
            href="/"
            onClick={() => localStorage.removeItem('participant')}
            className="text-emerald-600 hover:text-emerald-800 font-medium text-sm"
          >
            Exit Game
          </Link>
        </div>
      </header>

      <main className="bg-white shadow-md rounded-lg p-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Ready to Play!</h2>
          <p className="text-gray-600">
            The game will start soon. Get ready to answer Islamic trivia questions and win rewards!
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-emerald-800 mb-2">How to Play</h3>
          <ul className="space-y-2 text-gray-600">
            <li>• Wait for the host to start the game</li>
            <li>• Select questions from different difficulty levels</li>
            <li>• Answer correctly to earn points</li>
            <li>• The faster you answer, the more points you get</li>
            <li>• Redeem your points for exciting THR rewards!</li>
          </ul>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">Waiting for the game to start...</p>
          <div className="animate-pulse mt-4 flex justify-center">
            <div className="h-3 w-3 bg-emerald-400 rounded-full mr-1"></div>
            <div className="h-3 w-3 bg-emerald-400 rounded-full mr-1 animate-pulse delay-150"></div>
            <div className="h-3 w-3 bg-emerald-400 rounded-full animate-pulse delay-300"></div>
          </div>
        </div>
      </main>
    </div>
  );
} 