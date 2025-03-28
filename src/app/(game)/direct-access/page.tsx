'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { CardSkeleton } from '@/components/ui/Skeleton';

// Create a client component that uses search params
function DirectAccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [roomData, setRoomData] = useState<any>(null);
  
  useEffect(() => {
    const roomCode = searchParams.get('room');
    const accessCode = searchParams.get('code');
    
    if (!roomCode || !accessCode) {
      setError('Invalid access link. Missing room code or access code.');
      setIsLoading(false);
      return;
    }
    
    const verifyAndJoin = async () => {
      try {
        // First, fetch the room by its accessCode
        const roomResponse = await fetch(`/api/rooms/validate?code=${roomCode}`);
        if (!roomResponse.ok) {
          throw new Error('Room not found or inactive');
        }
        
        const roomData = await roomResponse.json();
        setRoomData(roomData.room);
        
        // Verify the participant's access code
        const verifyResponse = await fetch(`/api/access-codes/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomCode: roomCode,
            accessCode: accessCode,
          }),
        });
        
        if (!verifyResponse.ok) {
          const errorData = await verifyResponse.json();
          throw new Error(errorData.error || 'Invalid access code');
        }
        
        const verifyData = await verifyResponse.json();
        
        // If this is a returning participant, join directly
        if (verifyData.isReturning && verifyData.participantId) {
          const joinResponse = await fetch('/api/participants', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              roomId: roomData.room._id,
              name: verifyData.participantName || 'Returning Player',
              accessCode: accessCode,
              accessCodeId: verifyData.accessCodeId,
              participantId: verifyData.participantId
            }),
          });
          
          if (!joinResponse.ok) {
            const errorData = await joinResponse.json();
            throw new Error(errorData.message || 'Failed to rejoin the game');
          }
          
          const participantData = await joinResponse.json();
          
          // Store participant info in localStorage
          const participantInfo = {
            id: participantData.participant._id,
            name: participantData.participant.name,
            roomId: roomData.room._id,
            roomName: roomData.room.name,
            accessCode: accessCode,
            rejoining: true
          };
          
          localStorage.setItem('participant', JSON.stringify(participantInfo));
          
          // Show success message and redirect to game
          toast.success('Welcome back! Joining the game...');
          router.push(`/play/${roomData.room._id}?pid=${participantInfo.id}`);
        } else {
          // New participant, ask for name
          setShowNameInput(true);
          setIsLoading(false);
        }
      } catch (error: any) {
        console.error('Error accessing room:', error);
        setError(error.message || 'Failed to access the room');
        setIsLoading(false);
      }
    };
    
    verifyAndJoin();
  }, [searchParams, router]);
  
  const handleJoinWithName = async () => {
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    
    const roomCode = searchParams.get('room');
    const accessCode = searchParams.get('code');
    
    if (!roomCode || !accessCode) {
      setError('Invalid access link. Missing room code or access code.');
      return;
    }
    
    if (!roomData) {
      setError('Room data not available. Please try again.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Verify the access code again
      const verifyResponse = await fetch(`/api/access-codes/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: roomCode,
          accessCode: accessCode,
        }),
      });
      
      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.error || 'Invalid access code');
      }
      
      const verifyData = await verifyResponse.json();
      
      // Join the room with the provided name
      const joinResponse = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: roomData._id,
          name: name,
          accessCode: accessCode,
          accessCodeId: verifyData.accessCodeId,
        }),
      });
      
      if (!joinResponse.ok) {
        const errorData = await joinResponse.json();
        throw new Error(errorData.message || 'Failed to join the game');
      }
      
      const participantData = await joinResponse.json();
      
      // Store participant info in localStorage
      const participantInfo = {
        id: participantData.participant._id,
        name: participantData.participant.name,
        roomId: roomData._id,
        roomName: roomData.name,
        accessCode: accessCode,
      };
      
      localStorage.setItem('participant', JSON.stringify(participantInfo));
      
      // Show success message and redirect to game
      toast.success('Successfully joined the game!');
      router.push(`/play/${roomData._id}?pid=${participantInfo.id}`);
    } catch (error: any) {
      console.error('Error joining room:', error);
      setError(error.message || 'Failed to join the room');
      setIsLoading(false);
    }
  };
  
  if (isLoading && !showNameInput) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="flex justify-center mb-4">
            <svg className="animate-spin h-12 w-12 text-[#128C7E]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-center text-gray-800 mb-2">
            Accessing Game Room
          </h2>
          <p className="text-center text-gray-600">
            Please wait while we connect you to the game...
          </p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="flex justify-center mb-4 text-red-500">
            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-center text-gray-800 mb-2">
            Access Error
          </h2>
          <p className="text-center text-red-600 mb-4">
            {error}
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => router.push('/join')}
              className="px-4 py-2 bg-[#128C7E] text-white rounded-md shadow hover:bg-[#075E54] focus:outline-none focus:ring-2 focus:ring-[#128C7E] focus:ring-offset-2"
            >
              Go to Join Page
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (showNameInput) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="flex justify-center mb-4 text-[#128C7E]">
            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-center text-gray-800 mb-2">
            Enter Your Name
          </h2>
          <p className="text-center text-gray-600 mb-4">
            Please enter your name to join the game
          </p>
          
          <div className="mb-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#128C7E]"
            />
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={handleJoinWithName}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-[#128C7E] text-white rounded-md shadow hover:bg-[#075E54] focus:outline-none focus:ring-2 focus:ring-[#128C7E] focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Joining...
                </>
              ) : 'Join Game'}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return null;
}

// Create a loading fallback for Suspense
function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <CardSkeleton className="animate-pulse" />
        <h2 className="text-xl font-semibold text-center text-gray-800 mt-4">
          Loading...
        </h2>
      </div>
    </div>
  );
}

// Wrap the direct access content with Suspense
export default function DirectAccess() {
  return (
    <Suspense fallback={<Loading />}>
      <DirectAccessContent />
    </Suspense>
  );
} 