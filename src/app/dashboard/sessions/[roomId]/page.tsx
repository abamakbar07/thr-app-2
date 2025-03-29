import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import dbConnect from '@/lib/db/connection';
import { Room } from '@/lib/db/models';
import { getSession } from '@/lib/auth/session';
import LeaderboardClient from '@/components/admin/LeaderboardClient';
import RewardManagement from '@/components/admin/RewardManagement';
import BatchStatusUpdater from '@/components/admin/BatchStatusUpdater';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Session Monitoring - Islamic Trivia THR',
  description: 'Monitor your Islamic Trivia game session',
};

interface SessionPageProps {
  params: {
    roomId: string;
  };
}

export default async function SessionPage({ params }: SessionPageProps) {
  const roomId = await params.roomId;
  
  await dbConnect();
  const session = await getSession();

  // Fetch room and verify ownership
  const room = await Room.findOne({ 
    _id: roomId, 
    createdBy: session?.user?.id 
  });

  if (!room) {
    notFound();
  }

  return (
    <div>
      <Toaster position="top-right" />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Live Session</h1>
          <p className="text-gray-500">Room: {room.name}</p>
        </div>
        <div className="flex space-x-4">
          <Link
            href={`/dashboard/rooms/${roomId}`}
            className="text-[#128C7E] hover:text-[#075E54] font-medium"
          >
            Back to Room Details
          </Link>
        </div>
      </div>
      
      <Tabs defaultValue="leaderboard" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="rewards">Reward Management</TabsTrigger>
          <TabsTrigger value="thr-status">THR Status</TabsTrigger>
        </TabsList>
        
        <TabsContent value="leaderboard">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Live Leaderboard</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Track participants' performance in real-time
                </p>
              </div>
              <div>
                <span className="inline-flex items-center px-3 py-1 text-sm rounded-full bg-green-100 text-green-800">
                  <span className="relative flex h-3 w-3 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  Live
                </span>
              </div>
            </div>
            
            <Suspense fallback={<div className="p-6">Loading leaderboard...</div>}>
              <LeaderboardClient
                initialData={[]}
                roomId={roomId}
                updateIntervalMs={3000}
              />
            </Suspense>
          </div>
        </TabsContent>
        
        <TabsContent value="rewards">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Reward Management</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Manage THR rewards and redemptions for participants
              </p>
            </div>
            
            <Suspense fallback={<div className="p-6">Loading reward management...</div>}>
              <RewardManagement roomId={roomId} />
            </Suspense>
          </div>
        </TabsContent>
        
        <TabsContent value="thr-status">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">THR Claim Status Management</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Update THR claim status for participants in this room
              </p>
            </div>
            
            <Suspense fallback={<div className="p-6">Loading THR status management...</div>}>
              <div className="p-6">
                <BatchStatusUpdater roomId={roomId} />
                
                <div className="mt-8">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Manual Updates</h4>
                  <p className="text-sm text-gray-500 mb-4">
                    To update individual participants, visit the 
                    <Link href="/dashboard/participants" className="text-[#128C7E] hover:text-[#075E54] ml-1">
                      Participants
                    </Link> page and filter by this room.
                  </p>
                </div>
              </div>
            </Suspense>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 