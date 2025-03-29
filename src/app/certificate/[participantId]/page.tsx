import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import dbConnect from '@/lib/db/connection';
import { Participant, Answer } from '@/lib/db/models';
import { formatCurrency } from '@/lib/utils';
import { PrintButton } from './PrintButton';

interface PageProps {
  params: {
    participantId: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { participantId } = await params;
  await dbConnect();
  const participant = await Participant.findById(participantId);
  
  if (!participant) {
    return {
      title: 'Certificate Not Found - Islamic Trivia THR',
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

export default async function PublicCertificatePage({ params }: PageProps) {
  const { participantId } = await params;
  await dbConnect();
  
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
  
  // Format date
  const joinedAtFormatted = new Date(participant.joinedAt).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
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
        
        <div className="text-center">
          <PrintButton />
          
          <a 
            href="/"
            className="px-4 py-2 text-sm font-medium text-[#128C7E] bg-white border border-[#128C7E] rounded-md hover:bg-gray-50 ml-4"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
} 