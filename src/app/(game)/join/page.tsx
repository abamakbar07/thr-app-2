'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function JoinRoom() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [joinData, setJoinData] = useState({
    accessCode: '',
    name: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setJoinData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      // Convert access code to uppercase
      const formattedAccessCode = joinData.accessCode.toUpperCase().trim();
      
      const response = await fetch('/api/participants/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...joinData,
          accessCode: formattedAccessCode,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Navigate to the game room
        router.push(`/play/${data.roomId}?pid=${data.participantId}`);
      } else {
        const error = await response.json();
        setErrorMessage(error.message || 'Failed to join the room. Please check your access code.');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-100 to-teal-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-emerald-600 p-6 text-white text-center">
          <h1 className="text-2xl font-bold">Islamic Trivia</h1>
          <p className="text-emerald-100">Join a game room to play</p>
        </div>
        
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-md text-sm">
              {errorMessage}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700 mb-1">
                Room Access Code
              </label>
              <input
                type="text"
                id="accessCode"
                name="accessCode"
                value={joinData.accessCode}
                onChange={handleChange}
                placeholder="Enter 6-character code"
                required
                maxLength={6}
                className="w-full p-3 border border-gray-300 rounded-md font-mono text-lg text-center uppercase tracking-widest focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={joinData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                required
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 text-white py-3 rounded-md font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Joining...' : 'Join Game'}
            </button>
          </form>
        </div>
      </div>
      
      <div className="mt-8 text-center text-gray-600 text-sm">
        <p>Eid Mubarak! Get ready to test your Islamic knowledge</p>
        <p className="mt-1">Play and win exciting THR rewards</p>
      </div>
    </div>
  );
} 