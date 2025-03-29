import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import dbConnect from '@/lib/db/connection';
import { Participant, Room, Answer, Redemption } from '@/lib/db/models';
import { formatCurrency, getRelativeTimeString } from '@/lib/utils';
import { PrintButton } from './PrintButton';
import { SocialShareButtons } from './SocialShareButtons';
import { Suspense } from 'react';
import ParticipantStatusUpdater from '@/components/admin/ParticipantStatusUpdater';
import { Toaster } from 'react-hot-toast';

interface PageProps {
  params: {
    participantId: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await dbConnect();
  // Get the participantId from params properly
  const { participantId } = await params;
  const participant = await Participant.findById(participantId).populate('roomId');
  
  if (!participant) {
    return {
      title: 'Participant Not Found - Islamic Trivia THR',
    };
  }
  
  return {
    title: `${participant.name} - Islamic Trivia THR Certificate`,
    description: `${participant.name} has earned ${formatCurrency(participant.totalRupiah)} in the Islamic Trivia game.`,
    openGraph: {
      title: `${participant.name} - Islamic Trivia THR Certificate`,
      description: `${participant.name} has earned ${formatCurrency(participant.totalRupiah)} in the Islamic Trivia game.`,
      type: 'profile',
    },
  };
}

export default async function ParticipantDetailPage({ params }: PageProps) {
  await dbConnect();
  
  // Get the participantId from params properly
  const { participantId } = await params;
  
  // Get participant details
  const participant = await Participant.findById(participantId).populate('roomId');
  
  if (!participant) {
    return notFound();
  }
  
  // Get answer stats
  const answers = await Answer.find({ participantId }).populate('questionId');
  const totalAnswers = answers.length;
  const correctAnswers = answers.filter(answer => answer.isCorrect).length;
  const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
  
  // Get redemptions
  const redemptions = await Redemption.find({ participantId })
    .populate('rewardId')
    .sort({ claimedAt: -1 });
  
  const totalClaimed = redemptions
    .filter(r => r.status !== 'cancelled')
    .reduce((sum, r) => sum + r.rupiahSpent, 0);
  
  const remainingBalance = participant.totalRupiah - totalClaimed;
  
  // Format date
  const joinedAtFormatted = new Date(participant.joinedAt).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  return (
    <div>
      <Toaster position="top-right" />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Participant Details</h1>
        <div className="flex gap-2">
          <Link 
            href={`/dashboard/participants/${participantId}/edit`} 
            className="px-3 py-2 text-sm font-medium text-white bg-[#128C7E] rounded-md hover:bg-[#0e6b5e]"
          >
            Edit Participant
          </Link>
          <PrintButton />
        </div>
      </div>
      
      {/* Certificate Card */}
      <div id="certificate" className="bg-white p-8 rounded-lg shadow-lg border border-gray-200 mb-8 relative print:shadow-none print:border-0 print:p-0">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-16 bg-[#128C7E] rounded-t-lg print:h-24"></div>
        <div className="absolute bottom-0 left-0 w-full h-8 bg-[#128C7E] rounded-b-lg print:h-12"></div>
        <div className="absolute top-16 left-8 right-8 h-1 bg-[#25D366] print:top-24 print:h-2"></div>
        <div className="absolute bottom-8 left-8 right-8 h-1 bg-[#25D366] print:bottom-12 print:h-2"></div>
        
        {/* Islamic pattern - simulated with a border */}
        <div className="border-8 border-[#f8f8f8] rounded-lg p-8 pt-24 pb-16 relative z-10 print:border-[#f0f0f0] print:p-12 print:pt-32 print:pb-24">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#128C7E] mb-2 print:text-5xl">Certificate of Achievement</h2>
            <p className="text-gray-600 print:text-xl">Islamic Trivia THR Challenge</p>
          </div>
          
          <div className="text-center mb-8">
            <p className="text-lg text-gray-700 mb-1 print:text-2xl">This is to certify that</p>
            <h3 className="text-4xl font-bold mb-1 print:text-6xl">{participant.name}</h3>
            <p className="text-lg text-gray-700 mb-6 print:text-2xl">
              has successfully participated in the Islamic Trivia Challenge
              <br />organized on {joinedAtFormatted}
            </p>
            
            <div className="w-32 h-32 bg-[#128C7E] rounded-full mx-auto flex items-center justify-center text-white mb-6 print:w-48 print:h-48">
              <div className="text-center">
                <div className="text-4xl font-bold print:text-6xl">{accuracy}%</div>
                <div className="text-sm print:text-base">Accuracy</div>
              </div>
            </div>
            
            <p className="text-2xl font-bold mb-2 print:text-4xl">
              Total THR Earned:
            </p>
            <div className="text-4xl font-bold text-[#128C7E] mb-4 print:text-6xl">
              {formatCurrency(participant.totalRupiah)}
            </div>
            
            <div className="text-gray-600 print:text-xl">
              Room: {participant.roomId?.name || 'General Islamic Trivia'}
            </div>
          </div>
          
          <div className="flex justify-between items-center print:mt-12">
            <div className="text-center">
              <div className="w-24 h-1 bg-gray-400 mx-auto mb-2 print:w-32"></div>
              <p className="text-sm text-gray-600 print:text-base">Organizer Signature</p>
            </div>
            
            <div className="text-center">
              <div className="font-mono text-sm text-gray-500 print:text-base">
                ID: {participant._id.toString().substring(0, 8)}
              </div>
            </div>
            
            <div className="text-center">
              <div className="w-24 h-1 bg-gray-400 mx-auto mb-2 print:w-32"></div>
              <p className="text-sm text-gray-600 print:text-base">Date</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Participant Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Participant Information</h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="text-sm text-gray-900">{participant.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Joined</dt>
              <dd className="text-sm text-gray-900">{getRelativeTimeString(participant.joinedAt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Room</dt>
              <dd className="text-sm text-gray-900">{participant.roomId?.name || 'Unknown'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Access Code</dt>
              <dd className="text-sm font-mono text-gray-900">{participant.accessCode}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="text-sm text-gray-900">{participant.currentStatus}</dd>
            </div>
          </dl>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Performance</h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Questions Answered</dt>
              <dd className="text-sm text-gray-900">{totalAnswers}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Correct Answers</dt>
              <dd className="text-sm text-gray-900">{correctAnswers}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Accuracy</dt>
              <dd className="text-sm text-gray-900">{accuracy}%</dd>
            </div>
          </dl>
          
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Accuracy</h4>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-[#25D366] h-2.5 rounded-full" 
                style={{ width: `${accuracy}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">THR Status</h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Total Earned</dt>
              <dd className="text-sm font-semibold text-gray-900">{formatCurrency(participant.totalRupiah)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Claimed</dt>
              <dd className="text-sm text-gray-900">{formatCurrency(totalClaimed)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Remaining</dt>
              <dd className="text-sm text-gray-900">{formatCurrency(remainingBalance)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Claim Status</dt>
              <dd className="text-sm text-gray-900">
                <Suspense fallback={
                  <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
                    participant.thrClaimStatus === 'claimed' ? 'bg-green-100 text-green-800' : 
                    participant.thrClaimStatus === 'processing' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {participant.thrClaimStatus.charAt(0).toUpperCase() + participant.thrClaimStatus.slice(1)}
                  </span>
                }>
                  <ParticipantStatusUpdater 
                    participantId={participant._id.toString()} 
                    initialStatus={participant.thrClaimStatus as 'unclaimed' | 'processing' | 'claimed'} 
                  />
                </Suspense>
              </dd>
            </div>
          </dl>
          
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-500 mb-2">THR Claimed</h4>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-[#128C7E] h-2.5 rounded-full" 
                style={{ 
                  width: `${participant.totalRupiah > 0 ? 
                    (totalClaimed / participant.totalRupiah) * 100 : 0}%` 
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {participant.totalRupiah > 0 ? 
                Math.round((totalClaimed / participant.totalRupiah) * 100) : 0}% claimed
            </p>
          </div>
        </div>
      </div>
      
      {/* Redemption History */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Redemption History</h3>
        </div>
        
        {redemptions.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {redemptions.map((redemption) => (
              <li key={redemption._id.toString()} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {redemption.rewardId?.name || 'System THR Claim'}
                      {redemption.systemCreated && (
                        <span className="ml-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          System
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(redemption.claimedAt).toLocaleDateString()} - {redemption.status}
                      {redemption.notes && (
                        <span className="ml-1 text-xs text-gray-400">
                          {redemption.notes}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(redemption.rupiahSpent)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-6 py-4 text-center text-gray-500">
            No redemptions yet
          </div>
        )}
      </div>
      
      {/* Answer History */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Answer History</h3>
        </div>
        
        {answers.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {answers.slice(0, 10).map((answer) => (
              <li key={answer._id.toString()} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {answer.questionId?.text || 'Unknown Question'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(answer.answeredAt).toLocaleString()}
                    </p>
                  </div>
                  <div className={`text-sm font-medium ${answer.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                    {answer.isCorrect ? 'Correct' : 'Incorrect'}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-6 py-4 text-center text-gray-500">
            No answers recorded
          </div>
        )}
        
        {answers.length > 10 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              Showing 10 of {answers.length} answers
            </p>
          </div>
        )}
      </div>
      
      {/* Social sharing buttons - Hidden on print */}
      <div className="fixed bottom-8 right-8 print:hidden">
        <div className="bg-white rounded-full shadow-lg p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Share Certificate:</p>
          <SocialShareButtons 
            participantName={participant.name} 
            totalRupiah={participant.totalRupiah} 
            participantId={participantId}
          />
        </div>
      </div>
    </div>
  );
} 