'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function JoinGame() {
  const [step, setStep] = useState(1);
  const [roomCode, setRoomCode] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [roomData, setRoomData] = useState<any>(null);
  const [participantData, setParticipantData] = useState<any>(null);
  
  // State for previous game data
  const [hasPreviousGame, setHasPreviousGame] = useState(false);
  const [previousGameData, setPreviousGameData] = useState<{
    roomId: string;
    accessCode: string;
    name?: string;
  } | null>(null);

  // Check for previous game data on component mount
  useEffect(() => {
    const lastAccessCode = localStorage.getItem('lastAccessCode');
    const lastRoomId = localStorage.getItem('lastRoomId');
    const lastParticipantName = localStorage.getItem('lastParticipantName');
    
    if (lastAccessCode && lastRoomId) {
      setHasPreviousGame(true);
      setPreviousGameData({
        roomId: lastRoomId,
        accessCode: lastAccessCode,
        name: lastParticipantName || undefined
      });
    }
  }, []);
  
  const handleContinuePreviousGame = async () => {
    if (!previousGameData) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // Fetch the room details first to validate
      const roomResponse = await fetch(`/api/rooms/${previousGameData.roomId}`);
      if (!roomResponse.ok) {
        throw new Error('Previous room is no longer available');
      }
      
      const roomData = await roomResponse.json();
      console.log('Room data:', roomData);
      
      // Verify the access code with the API
      const verifyResponse = await fetch(`/api/access-codes/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomCode: roomData.room.accessCode,
          accessCode: previousGameData.accessCode,
        }),
      });
      
      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.error || 'Previous access code is no longer valid');
      }
      
      const verifyData = await verifyResponse.json();
      console.log('Verify response:', verifyData);
      
      // Join/rejoin the participant
      const joinResponse = await fetch('/api/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: previousGameData.roomId,
          name: previousGameData.name || 'Player',
          accessCode: previousGameData.accessCode,
          accessCodeId: verifyData.accessCodeId,
          ...(verifyData.participantId && { participantId: verifyData.participantId })
        }),
      });
      
      if (!joinResponse.ok) {
        const errorData = await joinResponse.json();
        throw new Error(errorData.message || 'Failed to rejoin the game');
      }
      
      const participantData = await joinResponse.json();
      console.log('Join response:', participantData);
      
      // Store participant info in localStorage
      const participantInfo = {
        id: participantData.participant._id,
        name: participantData.participant.name,
        roomId: previousGameData.roomId,
        roomName: roomData.room.name,
        accessCode: previousGameData.accessCode,
        rejoining: true
      };
      
      // Remove temporary storage first
      localStorage.removeItem('lastAccessCode');
      localStorage.removeItem('lastRoomId');
      localStorage.removeItem('lastParticipantName');
      
      // Then store the participant info
      localStorage.setItem('participant', JSON.stringify(participantInfo));
      
      setIsLoading(false);
      toast.success('Welcome back! Continuing your game progress.');
      
      // Use direct page navigation instead of Next.js router
      window.location.href = `/play/${previousGameData.roomId}?pid=${participantInfo.id}`;
    } catch (error: any) {
      console.error('Error continuing previous game:', error);
      setError(error.message || 'Failed to continue previous game');
      
      // Clear the previous game data as it's no longer valid
      localStorage.removeItem('lastAccessCode');
      localStorage.removeItem('lastRoomId');
      localStorage.removeItem('lastParticipantName');
      
      setHasPreviousGame(false);
      setPreviousGameData(null);
      
      // Go back to step 1
      setStep(1);
      setIsLoading(false);
    }
  };

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
      console.log('Validating access code:', accessCode, 'for room:', roomCode);
      
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Invalid access code');
      }

      const verifyData = await response.json();
      console.log('Verify response:', verifyData);

      // Check if this is a returning participant
      const isReturning = verifyData.isReturning || false;
      const participantId = verifyData.participantId;

      if (isReturning && participantId) {
        // This is a returning participant with an existing record
        console.log('Returning participant detected');
        
        // Join the room directly with the existing participant ID
        const joinResponse = await fetch('/api/participants', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            roomId: roomData._id,
            name: verifyData.participantName || 'Returning Player',
            accessCode: accessCode,
            accessCodeId: verifyData.accessCodeId,
            participantId: participantId
          }),
        });

        if (!joinResponse.ok) {
          const errorData = await joinResponse.json();
          throw new Error(errorData.message || 'Failed to rejoin the game');
        }

        const participantData = await joinResponse.json();
        console.log('Join response for returning participant:', participantData);

        // Store participant info in localStorage
        const participantInfo = {
          id: participantData.participant._id,
          name: participantData.participant.name,
          roomId: roomData._id,
          roomName: roomData.name,
          accessCode: accessCode,
          rejoining: true
        };
        
        localStorage.setItem('participant', JSON.stringify(participantInfo));
        
        // Show success message
        toast.success('Welcome back! Continuing your game progress.');
        
        // Reset loading state before navigation
        setIsLoading(false);
        
        // Use direct navigation for more reliability
        window.location.href = `/play/${roomData._id}?pid=${participantInfo.id}`;
        return;
      }
      
      // Store the access code ID for later use when joining as a new participant
      localStorage.setItem('accessCodeId', verifyData.accessCodeId);
      
      // Proceed to name input step for new participants
      setStep(3);
      setIsLoading(false);
    } catch (error: any) {
      console.error('Error validating access code:', error);
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
      console.log('Joining game as new participant');
      
      // Retrieve stored accessCodeId
      const accessCodeId = localStorage.getItem('accessCodeId');
      
      if (!accessCodeId) {
        throw new Error('Missing access code information. Please try again.');
      }

      // Join the room as a new participant
      const participantResponse = await fetch('/api/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: roomData._id,
          name: name,
          accessCode: accessCode,
          accessCodeId: accessCodeId
        }),
      });

      if (!participantResponse.ok) {
        const errorData = await participantResponse.json();
        throw new Error(errorData.message || 'Failed to join the game');
      }

      const participantData = await participantResponse.json();
      console.log('Join response for new participant:', participantData);

      // Store participant info in localStorage
      const participantInfo = {
        id: participantData.participant._id,
        name: participantData.participant.name,
        roomId: roomData._id,
        roomName: roomData.name,
        accessCode: accessCode,
        rejoining: false
      };
      
      // Remove the temporary accessCodeId
      localStorage.removeItem('accessCodeId');
      
      // Store the participant info
      localStorage.setItem('participant', JSON.stringify(participantInfo));

      // Show welcome message
      toast.success('Successfully joined the game!');

      // Reset loading state before navigation
      setIsLoading(false);
      
      // Use direct navigation for more reliability
      window.location.href = `/play/${roomData._id}?pid=${participantInfo.id}`;
    } catch (error: any) {
      console.error('Error joining game:', error);
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
            
            {/* Previous Game Option */}
            {hasPreviousGame && step === 1 && (
              <div className="mb-6 p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                <h3 className="text-lg font-medium text-blue-800 mb-2">Continue Previous Game</h3>
                <p className="text-sm text-blue-600 mb-4">
                  We found your previous game session. Would you like to continue where you left off?
                </p>
                <button
                  onClick={handleContinuePreviousGame}
                  disabled={isLoading}
                  className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isLoading ? 'Connecting...' : 'Continue Previous Game'}
                </button>
                <div className="mt-2 text-center">
                  <button 
                    onClick={() => {
                      // Clear previous game data
                      localStorage.removeItem('lastAccessCode');
                      localStorage.removeItem('lastRoomId');
                      localStorage.removeItem('lastParticipantName');
                      setHasPreviousGame(false);
                      setPreviousGameData(null);
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Start Fresh Instead
                  </button>
                </div>
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