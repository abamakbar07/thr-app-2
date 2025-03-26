'use client';

import { useState, useEffect } from 'react';
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
    
    try {
      // Fetch the room details first to validate
      const roomResponse = await fetch(`/api/rooms/${previousGameData.roomId}`);
      if (!roomResponse.ok) {
        throw new Error('Previous room is no longer available');
      }
      
      const roomData = await roomResponse.json();
      
      // Verify the access code with the API
      const accessCodeResponse = await fetch(`/api/access-codes/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomCode: roomData.room.accessCode,
          accessCode: previousGameData.accessCode,
        }),
      });
      
      if (!accessCodeResponse.ok) {
        throw new Error('Previous access code is no longer valid');
      }
      
      const accessCodeData = await accessCodeResponse.json();
      console.log('Access code verification response:', accessCodeData);
      
      // Use the participant API to rejoin with the previous access code
      const joinResponse = await fetch('/api/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: previousGameData.roomId,
          name: previousGameData.name || 'Player',
          accessCode: previousGameData.accessCode,
          accessCodeId: accessCodeData.accessCodeId,
          // Only include participantId if it exists in response
          ...(accessCodeData.participantId && { participantId: accessCodeData.participantId })
        }),
      });
      
      if (!joinResponse.ok) {
        throw new Error('Failed to rejoin the game');
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
      
      localStorage.setItem('participant', JSON.stringify(participantInfo));
      
      // Clear the temporary storage
      localStorage.removeItem('lastAccessCode');
      localStorage.removeItem('lastRoomId');
      localStorage.removeItem('lastParticipantName');
      
      setIsLoading(false);
      
      // Show welcome message
      toast.success('Welcome back! Continuing your game progress.');
      
      // Redirect to the game - use replace instead of push for more reliable navigation
      window.location.href = `/play/${previousGameData.roomId}`;
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

      // Store the access code ID for later use when joining
      const accessCodeId = data.accessCodeId;

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

      if (participantResponse.ok && participantData.participant) {
        // Existing participant, store data and proceed to game
        setParticipantData(participantData.participant);
        
        // If participant has a name, use it directly
        if (participantData.participant.name) {
          // Store participant info in localStorage
          const participantInfo = {
            id: participantData.participant._id,
            name: participantData.participant.name,
            roomId: roomData._id,
            roomName: roomData.name,
            accessCode: accessCode,
            rejoining: true // Flag to indicate this is a rejoining participant
          };
          
          // Ensure all required fields are present
          if (!participantInfo.id || !participantInfo.roomId || !participantInfo.accessCode) {
            throw new Error('Missing required participant information');
          }
          
          localStorage.setItem('participant', JSON.stringify(participantInfo));
          toast.success('Welcome back! Continuing your game progress.');

          // Reset loading state before navigation
          setIsLoading(false);

          // Redirect to the game room
          router.push(`/play/${roomData._id}`);
        } else {
          // Has participant record but needs name update
          // Go to name input step but pre-fill with previous name if available
          if (participantData.participant.name) {
            setName(participantData.participant.name);
          }
          localStorage.setItem('participantId', participantData.participant._id);
          localStorage.setItem('accessCodeId', accessCodeId);
          setStep(3);
          setIsLoading(false);
        }
      } else {
        // First-time participant, store accessCodeId for registration
        localStorage.setItem('accessCodeId', accessCodeId);
        
        // Go to name input step
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
      // Retrieve stored accessCodeId if available
      const accessCodeId = localStorage.getItem('accessCodeId');
      const participantId = localStorage.getItem('participantId');

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
          accessCodeId: accessCodeId,
          participantId: participantId // Include participant ID for rejoining
        }),
      });

      const participantData = await participantResponse.json();

      if (!participantResponse.ok) {
        throw new Error(participantData.message || 'Failed to join the game');
      }

      // Store participant info in localStorage
      const participantInfo = {
        id: participantData.participant._id,
        name: participantData.participant.name,
        roomId: roomData._id,
        roomName: roomData.name,
        accessCode: accessCode,
        rejoining: participantId ? true : false // Flag if this is a rejoining participant
      };
      
      // Ensure all required fields are present
      if (!participantInfo.id || !participantInfo.roomId || !participantInfo.accessCode) {
        throw new Error('Missing required participant information');
      }
      
      localStorage.setItem('participant', JSON.stringify(participantInfo));

      // Remove the temporary data
      localStorage.removeItem('accessCodeId');
      localStorage.removeItem('participantId');

      // Show appropriate message
      if (participantInfo.rejoining) {
        toast.success('Welcome back! Continuing your game progress.');
      } else {
        toast.success('Successfully joined the game!');
      }

      // Reset loading state before navigation
      setIsLoading(false);
      
      // Redirect to the game room
      router.push(`/play/${roomData._id}`);
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