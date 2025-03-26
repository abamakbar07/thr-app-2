import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import dbConnect from '@/lib/db/connection';
import { Room, Question, Participant } from '@/lib/db/models';
import { getSession } from '@/lib/auth/session';
import AccessCodeManager from '@/components/admin/AccessCodeManager';

export const metadata: Metadata = {
  title: 'Room Details - Islamic Trivia THR',
  description: 'View and manage your Islamic Trivia game room',
};

interface RoomDetailPageProps {
  params: {
    roomId: string;
  };
}

export default async function RoomDetailPage({ params }: RoomDetailPageProps) {
  // Get roomId from params
  const { roomId } = await params;
  
  await dbConnect();
  const session = await getSession();

  // Fetch room and verify ownership
  const room = await Room.findOne({ 
    _id: roomId, 
    createdBy: session?.user?.id 
  }).lean() as any;

  if (!room) {
    notFound();
  }

  // Get counts of questions by difficulty
  const questionCounts = {
    bronze: await Question.countDocuments({ roomId, difficulty: 'bronze' }),
    silver: await Question.countDocuments({ roomId, difficulty: 'silver' }),
    gold: await Question.countDocuments({ roomId, difficulty: 'gold' }),
  };
  
  // Get total number of participants
  const participantCount = await Participant.countDocuments({ roomId });

  // Format dates for display
  const startTime = new Date(room.startTime).toLocaleString();
  const endTime = new Date(room.endTime).toLocaleString();
  
  // Calculate room status
  const now = new Date();
  let status = "Upcoming";
  let statusColor: string = "bg-blue-100 text-blue-800";
  
  if (now > new Date(room.endTime)) {
    status = "Ended";
    statusColor = "bg-gray-100 text-gray-800";
  } else if (now >= new Date(room.startTime) && now <= new Date(room.endTime)) {
    status = "Active";
    statusColor = "bg-[#25D366] text-white";
  }
  
  if (!room.isActive) {
    status = "Inactive";
    statusColor = "bg-gray-100 text-gray-800";
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Link href="/dashboard/rooms" className="text-sm text-[#128C7E] hover:text-[#075E54] mb-2 inline-block flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Rooms
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">{room.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Room Code: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{room.accessCode}</span>
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/dashboard/rooms/${roomId}/edit`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-[#128C7E] hover:bg-[#075E54] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#128C7E] transition-colors duration-150"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Room
          </Link>
          {(status === "Active" || status === "Upcoming") && (
            <Link
              href={`/dashboard/sessions/${roomId}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-[#f0f2f5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#128C7E] transition-colors duration-150"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Monitor Session
            </Link>
          )}
        </div>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg border border-gray-100 overflow-hidden">
        {/* Room Info */}
        <div className="px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900">{room.description}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Start Time</dt>
              <dd className="mt-1 text-sm text-gray-900">{startTime}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">End Time</dt>
              <dd className="mt-1 text-sm text-gray-900">{endTime}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Time Per Question</dt>
              <dd className="mt-1 text-sm text-gray-900">{room.timePerQuestion} seconds</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Participants</dt>
              <dd className="mt-1 text-sm text-gray-900">{participantCount}</dd>
            </div>
          </dl>
        </div>
        
        {/* Settings */}
        <div className="border-t border-gray-100 px-4 py-5 sm:px-6 bg-[#f0f2f5]">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Game Settings</h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <li className="flex items-start">
              <div className={`flex-shrink-0 h-5 w-5 rounded-full ${room.showLeaderboard ? 'bg-[#25D366]' : 'bg-gray-200'} flex items-center justify-center`}>
                <span className={`h-3 w-3 rounded-full ${room.showLeaderboard ? 'bg-white' : 'bg-gray-400'}`}></span>
              </div>
              <p className="ml-3 text-sm text-gray-700">Show Leaderboard</p>
            </li>
            <li className="flex items-start">
              <div className={`flex-shrink-0 h-5 w-5 rounded-full ${room.allowRetries ? 'bg-[#25D366]' : 'bg-gray-200'} flex items-center justify-center`}>
                <span className={`h-3 w-3 rounded-full ${room.allowRetries ? 'bg-white' : 'bg-gray-400'}`}></span>
              </div>
              <p className="ml-3 text-sm text-gray-700">Allow Retries</p>
            </li>
            <li className="flex items-start">
              <div className={`flex-shrink-0 h-5 w-5 rounded-full ${room.showCorrectAnswers ? 'bg-[#25D366]' : 'bg-gray-200'} flex items-center justify-center`}>
                <span className={`h-3 w-3 rounded-full ${room.showCorrectAnswers ? 'bg-white' : 'bg-gray-400'}`}></span>
              </div>
              <p className="ml-3 text-sm text-gray-700">Show Correct Answers</p>
            </li>
          </ul>
        </div>
        
        {/* Questions Summary */}
        <div className="border-t border-gray-100 px-4 py-5 sm:px-6 bg-[#f0f2f5]">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Question Summary</h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-semibold text-amber-800">Bronze (Easy)</h4>
              <p className="mt-1 text-xl font-bold text-gray-900">{questionCounts.bronze}</p>
              <p className="text-sm text-amber-700 mt-1">questions</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800">Silver (Medium)</h4>
              <p className="mt-1 text-xl font-bold text-gray-900">{questionCounts.silver}</p>
              <p className="text-sm text-gray-700 mt-1">questions</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800">Gold (Hard)</h4>
              <p className="mt-1 text-xl font-bold text-gray-900">{questionCounts.gold}</p>
              <p className="text-sm text-yellow-700 mt-1">questions</p>
            </div>
          </div>
          
          <div className="mt-6">
            <Link 
              href={`/dashboard/rooms/${roomId}/questions`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-[#f0f2f5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#128C7E] transition-colors duration-150"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Manage Questions
            </Link>
          </div>
        </div>
        
        {/* Access Codes */}
        <AccessCodeManager roomId={roomId} />
      </div>
    </div>
  );
} 