'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function JoinGame() {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!accessCode.trim() || !name.trim()) {
      setError('Please enter both your name and the access code');
      return;
    }

    setIsLoading(true);

    try {
      // Check if room exists and is active
      const roomResponse = await fetch(`/api/rooms/validate?code=${accessCode}`);
      const roomData = await roomResponse.json();

      if (!roomResponse.ok) {
        throw new Error(roomData.message || 'Invalid access code');
      }

      // Join the room as a participant
      const participantResponse = await fetch('/api/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: roomData.room._id,
          name: name,
        }),
      });

      const participantData = await participantResponse.json();

      if (!participantResponse.ok) {
        throw new Error(participantData.message || 'Failed to join the game');
      }

      // Store participant info in localStorage
      localStorage.setItem('participant', JSON.stringify({
        id: participantData.participant._id,
        name: participantData.participant.name,
        roomId: roomData.room._id,
        roomName: roomData.room.name
      }));

      // Redirect to the game room
      router.push(`/game/${roomData.room._id}`);
    } catch (error: any) {
      setError(error.message || 'Failed to join the game');
      setIsLoading(false);
    }
  };

  return (
    <>
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link href="/" className="text-emerald-600 hover:text-emerald-700 font-semibold text-lg">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-emerald-50">
        <div className="w-full max-w-md">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
              Join a Trivia Game
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter the access code provided by your teacher or event organizer
            </p>
          </div>

          <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Your Name
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                    placeholder="Enter your name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700">
                  Access Code
                </label>
                <div className="mt-1">
                  <input
                    id="accessCode"
                    name="accessCode"
                    type="text"
                    required
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm uppercase"
                    placeholder="Enter room code (e.g. ABC123)"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full justify-center rounded-md border border-transparent bg-emerald-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Joining...' : 'Join Game'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
} 