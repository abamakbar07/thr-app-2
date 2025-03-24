import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import dbConnect from '@/lib/db/connection';
import { Room, Question, Participant } from '@/lib/db/models';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Room Details - Islamic Trivia THR',
  description: 'View and manage details for your Islamic Trivia game room',
};

interface RoomDetailPageProps {
  params: {
    roomId: string;
  };
}

export default async function RoomDetailPage({ params }: RoomDetailPageProps) {
  await dbConnect();
  const session = await getSession();

  // Fetch room and verify ownership
  const room = await Room.findOne({ 
    _id: params.roomId, 
    createdBy: session?.user?.id 
  }).lean() as any;

  if (!room) {
    notFound();
  }

  // Get counts of questions by difficulty
  const questionCounts = {
    bronze: await Question.countDocuments({ roomId: params.roomId, difficulty: 'bronze' }),
    silver: await Question.countDocuments({ roomId: params.roomId, difficulty: 'silver' }),
    gold: await Question.countDocuments({ roomId: params.roomId, difficulty: 'gold' }),
  };
  
  // Get total number of participants
  const participantCount = await Participant.countDocuments({ roomId: params.roomId });

  // Format dates for display
  const startTime = new Date(room.startTime).toLocaleString();
  const endTime = new Date(room.endTime).toLocaleString();
  
  // Calculate room status
  const now = new Date();
  let status = "Upcoming";
  let statusColor = "bg-blue-100 text-blue-800";
  
  if (now > new Date(room.endTime)) {
    status = "Ended";
    statusColor = "bg-gray-100 text-gray-800";
  } else if (now >= new Date(room.startTime) && now <= new Date(room.endTime)) {
    status = "Active";
    statusColor = "bg-green-100 text-green-800";
  }
  
  if (!room.isActive) {
    status = "Inactive";
    statusColor = "bg-yellow-100 text-yellow-800";
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Link href="/dashboard/rooms" className="text-sm text-indigo-600 hover:text-indigo-900 mb-2 inline-block">
            ← Back to Rooms
          </Link>
          <h1 className="text-2xl font-bold">{room.name}</h1>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/dashboard/rooms/${params.roomId}/edit`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Edit Room
          </Link>
          {(status === "Active" || status === "Upcoming") && (
            <Link
              href={`/dashboard/sessions/${params.roomId}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Monitor Session
            </Link>
          )}
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {/* Room Details */}
        <div className="border-b border-gray-200 px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Room Information</h3>
          <p className="mt-1 text-sm text-gray-500">Details about your game room.</p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Access Code</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono font-semibold">{room.accessCode}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <span className={`px-2 py-1 text-xs rounded-full ${statusColor}`}>
                  {status}
                </span>
              </dd>
            </div>
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
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Game Settings</h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <li className="flex items-start">
              <div className={`flex-shrink-0 h-5 w-5 rounded-full ${room.showLeaderboard ? 'bg-green-100' : 'bg-red-100'} flex items-center justify-center`}>
                <span className={`h-3 w-3 rounded-full ${room.showLeaderboard ? 'bg-green-400' : 'bg-red-400'}`}></span>
              </div>
              <p className="ml-3 text-sm text-gray-700">Show Leaderboard</p>
            </li>
            <li className="flex items-start">
              <div className={`flex-shrink-0 h-5 w-5 rounded-full ${room.allowRetries ? 'bg-green-100' : 'bg-red-100'} flex items-center justify-center`}>
                <span className={`h-3 w-3 rounded-full ${room.allowRetries ? 'bg-green-400' : 'bg-red-400'}`}></span>
              </div>
              <p className="ml-3 text-sm text-gray-700">Allow Retries</p>
            </li>
            <li className="flex items-start">
              <div className={`flex-shrink-0 h-5 w-5 rounded-full ${room.showCorrectAnswers ? 'bg-green-100' : 'bg-red-100'} flex items-center justify-center`}>
                <span className={`h-3 w-3 rounded-full ${room.showCorrectAnswers ? 'bg-green-400' : 'bg-red-400'}`}></span>
              </div>
              <p className="ml-3 text-sm text-gray-700">Show Correct Answers</p>
            </li>
          </ul>
        </div>
        
        {/* Questions Summary */}
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6 bg-gray-50">
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
              href={`/dashboard/rooms/${params.roomId}/questions`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Manage Questions
            </Link>
          </div>
        </div>
        
        {/* Actions */}
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Actions</h3>
        </div>
        <div className="px-4 py-5 sm:p-6 flex flex-wrap gap-4">
          <Link 
            href={`/dashboard/rooms/${params.roomId}/edit`}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Edit Room
          </Link>
          <Link 
            href={`/dashboard/rooms/${params.roomId}/participants`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            View Participants
          </Link>
          {status === "Active" && (
            <Link 
              href={`/dashboard/sessions/${params.roomId}/leaderboard`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              View Live Leaderboard
            </Link>
          )}
        </div>
      </div>
    </div>
  );
} 