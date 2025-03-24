'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Your Game Rooms</h2>
        <button
          onClick={() => router.push('/dashboard/rooms/new')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md"
        >
          Create New Room
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* This would be a map of rooms from the database */}
        <div className="bg-white shadow rounded-lg p-6 border-t-4 border-emerald-500">
          <h3 className="text-lg font-semibold mb-2">Demo Room</h3>
          <p className="text-gray-600 mb-4">This is a demo room with sample questions.</p>
          <div className="text-sm text-gray-500 mb-4">
            <p>Access Code: <span className="font-mono font-semibold">DEMO123</span></p>
            <p>Questions: 5</p>
            <p>Status: Active</p>
          </div>
          <div className="flex space-x-2">
            <Link 
              href="/dashboard/rooms/1" 
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded"
            >
              Manage
            </Link>
            <Link 
              href="/dashboard/rooms/1/questions" 
              className="bg-purple-500 hover:bg-purple-600 text-white text-sm px-3 py-1 rounded"
            >
              Questions
            </Link>
            <Link 
              href="/dashboard/rooms/1/rewards" 
              className="bg-amber-500 hover:bg-amber-600 text-white text-sm px-3 py-1 rounded"
            >
              Rewards
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 