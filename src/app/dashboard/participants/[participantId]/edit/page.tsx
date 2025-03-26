import { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import dbConnect from '@/lib/db/connection';
import { Participant } from '@/lib/db/models';
import { getSession } from '@/lib/auth/session';
import { formatCurrency } from '@/lib/utils';

interface PageProps {
  params: {
    participantId: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await dbConnect();
  const participant = await Participant.findById(params.participantId);
  
  if (!participant) {
    return {
      title: 'Participant Not Found - Islamic Trivia THR',
    };
  }
  
  return {
    title: `Edit ${participant.name} - Islamic Trivia THR`,
  };
}

async function updateParticipant(formData: FormData) {
  'use server';
  
  const participantId = formData.get('id')?.toString();
  if (!participantId) {
    throw new Error('Participant ID is required');
  }
  
  const name = formData.get('name')?.toString();
  const currentStatus = formData.get('currentStatus')?.toString();
  const thrClaimStatus = formData.get('thrClaimStatus')?.toString();
  
  // Call API to update participant
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/participants/${participantId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      currentStatus,
      thrClaimStatus,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update participant');
  }
  
  // Redirect to participant details page
  redirect(`/dashboard/participants/${participantId}`);
}

export default async function EditParticipantPage({ params }: PageProps) {
  await dbConnect();
  const session = await getSession();
  
  if (!session?.user) {
    return redirect('/api/auth/signin');
  }
  
  const participantId = params.participantId;
  
  // Get participant details
  const participant = await Participant.findById(participantId).populate('roomId', 'name');
  
  if (!participant) {
    return notFound();
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Participant</h1>
        <Link 
          href={`/dashboard/participants/${participantId}`} 
          className="px-3 py-2 text-sm font-medium text-[#128C7E] bg-white border border-[#128C7E] rounded-md hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <form action={updateParticipant}>
          <input type="hidden" name="id" value={participant._id.toString()} />
          
          <div className="grid grid-cols-1 gap-6 mt-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                defaultValue={participant.name}
                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div>
              <label htmlFor="roomId" className="block text-sm font-medium text-gray-700">
                Room
              </label>
              <input
                type="text"
                id="roomId"
                value={participant.roomId?.name || 'Unknown Room'}
                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-gray-50"
                disabled
              />
            </div>
            
            <div>
              <label htmlFor="totalRupiah" className="block text-sm font-medium text-gray-700">
                Total THR
              </label>
              <input
                type="text"
                id="totalRupiah"
                value={formatCurrency(participant.totalRupiah)}
                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-gray-50"
                disabled
              />
            </div>
            
            <div>
              <label htmlFor="currentStatus" className="block text-sm font-medium text-gray-700">
                Current Status
              </label>
              <select
                id="currentStatus"
                name="currentStatus"
                defaultValue={participant.currentStatus}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-[#128C7E] focus:border-[#128C7E] sm:text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="thrClaimStatus" className="block text-sm font-medium text-gray-700">
                THR Claim Status
              </label>
              <select
                id="thrClaimStatus"
                name="thrClaimStatus"
                defaultValue={participant.thrClaimStatus}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-[#128C7E] focus:border-[#128C7E] sm:text-sm"
              >
                <option value="unclaimed">Unclaimed</option>
                <option value="processing">Processing</option>
                <option value="claimed">Claimed</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                <strong>Unclaimed:</strong> THR has not been claimed yet<br />
                <strong>Processing:</strong> THR claim is being processed<br />
                <strong>Claimed:</strong> THR has been successfully claimed
              </p>
            </div>
            
            <div className="pt-4">
              <div className="flex justify-end">
                <Link
                  href={`/dashboard/participants/${participantId}`}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mr-3"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#128C7E] hover:bg-[#0e6b5e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#128C7E]"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 