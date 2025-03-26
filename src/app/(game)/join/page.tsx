'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function JoinGame() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [roomCode, setRoomCode] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [roomData, setRoomData] = useState<any>(null);
  const [participantData, setParticipantData] = useState<any>(null);

  const validateRoomCode = async () => {
    setError('');

    if (!roomCode.trim()) {
      setError('Please enter a valid room code');
      return;
    }

    setIsLoading(true);

    try {
      // Check if room exists and is active
      const response = await fetch(`/api/rooms/validate?code=${roomCode}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid room code');
      }

      setRoomData(data.room);
      setStep(2);
    } catch (error: any) {
      setError(error.message || 'Failed to validate room code');
    } finally {
      setIsLoading(false);
    }
  };

  const validateAccessCode = async () => {
    setError('');

    if (!accessCode.trim()) {
      setError('Please enter a valid access code');
      return;
    }

    setIsLoading(true);

    try {
      // Validate access code
      const response = await fetch(`/api/access-codes/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomCode: roomCode,
          accessCode: accessCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid access code');
      }

      // Check if participant already exists with this access code
      const participantResponse = await fetch(`/api/participants/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: roomData._id,
          accessCode: accessCode,
        }),
      });

      const participantData = await participantResponse.json();

      if (participantResponse.ok && participantData.participant?.name) {
        // Existing participant, store data and proceed to game
        setParticipantData(participantData.participant);
        
        // Store participant info in localStorage
        localStorage.setItem('participant', JSON.stringify({
          id: participantData.participant._id,
          name: participantData.participant.name,
          roomId: roomData._id,
          roomName: roomData.name,
          accessCode: accessCode
        }));

        // Reset loading state before navigation
        setIsLoading(false);

        // Redirect to the game room
        router.push(`/game/${roomData._id}`);
      } else {
        // First-time participant, go to name input step
        setStep(3);
        setIsLoading(false);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to validate access code');
      setIsLoading(false);
    }
  };

  const handleJoinGame = async () => {
    setError('');

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);

    try {
      // Join the room as a participant
      const participantResponse = await fetch('/api/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: roomData._id,
          name: name,
          accessCode: accessCode,
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
        roomId: roomData._id,
        roomName: roomData.name,
        accessCode: accessCode
      }));

      // Reset loading state before navigation
      setIsLoading(false);
      
      // Redirect to the game room
      router.push(`/game/${roomData._id}`);
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
              {step === 1 && "Enter the room code provided by your teacher or event organizer"}
              {step === 2 && "Enter your access code to continue"}
              {step === 3 && "Enter your name to join the game"}
            </p>
          </div>

          <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            
            {/* Step 1: Room Code Input */}
            {step === 1 && (
              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); validateRoomCode(); }}>
                <div>
                  <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700">
                    Room Code
                  </label>
                  <div className="mt-1">
                    <input
                      id="roomCode"
                      name="roomCode"
                      type="text"
                      required
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
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
                    {isLoading ? 'Validating...' : 'Continue'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Access Code Input */}
            {step === 2 && (
              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); validateAccessCode(); }}>
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
                      placeholder="Enter your access code"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    This code was provided to you by your teacher or event organizer
                  </p>
                </div>

                <div className="flex flex-col space-y-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full justify-center rounded-md border border-transparent bg-emerald-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Validating...' : 'Continue'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-emerald-600 hover:text-emerald-700 text-sm"
                  >
                    ← Back to room code
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Name Input (First Time) */}
            {step === 3 && (
              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleJoinGame(); }}>
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

                <div className="flex flex-col space-y-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full justify-center rounded-md border border-transparent bg-emerald-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Joining...' : 'Join Game'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-emerald-600 hover:text-emerald-700 text-sm"
                  >
                    ← Back to access code
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 