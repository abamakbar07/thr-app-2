'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface RoomData {
  _id: string;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  timePerQuestion: number;
  showLeaderboard: boolean;
  allowRetries: boolean;
  showCorrectAnswers: boolean;
  accessCode: string;
  isActive: boolean;
}

interface EditRoomFormProps {
  roomData: RoomData;
}

export default function EditRoomForm({ roomData }: EditRoomFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: roomData.name,
    description: roomData.description,
    startTime: roomData.startTime,
    endTime: roomData.endTime,
    timePerQuestion: roomData.timePerQuestion,
    showLeaderboard: roomData.showLeaderboard,
    allowRetries: roomData.allowRetries,
    showCorrectAnswers: roomData.showCorrectAnswers,
    isActive: roomData.isActive
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : type === 'number' 
          ? Number(value) 
          : value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(`/api/rooms/${roomData._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update room');
      }
      
      // Show success message
      setSuccess('Room updated successfully!');
      
      // After a delay, redirect
      setTimeout(() => {
        router.push('/dashboard/rooms');
        router.refresh();
      }, 1500);
    } catch (err) {
      console.error('Error updating room:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-lg shadow-sm animate-fadeIn">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 rounded-lg shadow-sm animate-fadeIn">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Basic Information */}
      <div className="bg-white p-6 rounded-xl shadow-sm transition-all hover:shadow-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter room name"
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition-all"
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              required
              placeholder="Describe your room..."
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition-all"
            />
          </div>
        </div>
      </div>
      
      {/* Schedule */}
      <div className="bg-white p-6 rounded-xl shadow-sm transition-all hover:shadow-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule</h3>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
            <input
              type="datetime-local"
              id="startTime"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              required
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition-all"
            />
          </div>
          
          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
            <input
              type="datetime-local"
              id="endTime"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              required
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition-all"
            />
          </div>
        </div>
      </div>
      
      {/* Game Settings */}
      <div className="bg-white p-6 rounded-xl shadow-sm transition-all hover:shadow-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Game Settings</h3>
        
        <div className="mb-4">
          <label htmlFor="timePerQuestion" className="block text-sm font-medium text-gray-700 mb-1">Time Per Question (seconds)</label>
          <div className="relative rounded-md shadow-sm w-full max-w-xs">
            <input
              type="number"
              id="timePerQuestion"
              name="timePerQuestion"
              value={formData.timePerQuestion}
              onChange={handleChange}
              min={5}
              max={60}
              required
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition-all pr-12"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-gray-500 sm:text-sm">seconds</span>
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-500">How long participants have to answer each question (5-60 seconds)</p>
        </div>
        
        <div className="space-y-4 mt-6">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="showLeaderboard"
                name="showLeaderboard"
                type="checkbox"
                checked={formData.showLeaderboard}
                onChange={handleChange}
                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 transition-all"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="showLeaderboard" className="font-medium text-gray-700">Show Leaderboard</label>
              <p className="text-gray-500">Display a leaderboard to participants during the game</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="allowRetries"
                name="allowRetries"
                type="checkbox"
                checked={formData.allowRetries}
                onChange={handleChange}
                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 transition-all"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="allowRetries" className="font-medium text-gray-700">Allow Retries</label>
              <p className="text-gray-500">Let participants retry questions they've answered incorrectly</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="showCorrectAnswers"
                name="showCorrectAnswers"
                type="checkbox"
                checked={formData.showCorrectAnswers}
                onChange={handleChange}
                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 transition-all"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="showCorrectAnswers" className="font-medium text-gray-700">Show Correct Answers</label>
              <p className="text-gray-500">Display correct answers after questions are answered</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Room Status */}
      <div className="bg-white p-6 rounded-xl shadow-sm transition-all hover:shadow-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Room Status</h3>
        
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="isActive"
              name="isActive"
              type="checkbox"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 transition-all"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="isActive" className="font-medium text-gray-700">Active</label>
            <p className="text-gray-500">Set the room as active to allow participants to join</p>
          </div>
        </div>
      </div>
      
      {/* Access Code */}
      <div className="bg-white p-6 rounded-xl shadow-sm transition-all hover:shadow-md">
        <div className="flex items-start">
          <div className="flex-shrink-0 text-indigo-500">
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-md font-medium text-gray-900">Access Code</h3>
            <p className="text-sm text-gray-500 mt-1">
              The room's access code is <span className="font-mono font-medium text-indigo-600">{roomData.accessCode}</span>.
              You'll need to share this with participants so they can join.
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-4 mt-8">
        <button
          type="button"
          onClick={() => router.push(`/dashboard/rooms/${roomData._id}`)}
          className="px-5 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-70"
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : (
            'Save Room'
          )}
        </button>
      </div>
    </form>
  );
} 