import { Metadata } from 'next';
import Link from 'next/link';
import dbConnect from '@/lib/db/connection';
import { Reward, Redemption, Participant } from '@/lib/db/models';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Rewards - Islamic Trivia THR',
  description: 'Manage rewards and redemptions for Islamic Trivia THR',
};

export default async function RewardsPage() {
  await dbConnect();
  const session = await getSession();
  
  // Fetch all rewards created by the current user
  const rewards = await Reward.find({ createdBy: session?.user?.id }).sort({ pointsRequired: 1 });
  
  // Fetch recent redemptions
  const redemptions = await Redemption.find()
    .populate('rewardId')
    .populate('participantId')
    .sort({ createdAt: -1 })
    .limit(10);
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Rewards</h1>
        <Link 
          href="/dashboard/rewards/new" 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create New Reward
        </Link>
      </div>
      
      {/* Rewards List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Available Rewards</h3>
          <p className="mt-1 text-sm text-gray-500">Rewards that participants can claim with their points</p>
        </div>
        
        {rewards.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {rewards.map((reward) => (
              <li key={reward._id.toString()} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-md ${
                        reward.tier === 'bronze' ? 'bg-yellow-100' :
                        reward.tier === 'silver' ? 'bg-gray-100' :
                        'bg-yellow-200'
                      }`}>
                        <span className="text-lg font-semibold">
                          {reward.tier === 'bronze' ? '🥉' :
                           reward.tier === 'silver' ? '🥈' :
                           '🥇'}
                        </span>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg font-medium text-gray-900 truncate">{reward.name}</h4>
                        <p className="text-sm text-gray-500">{reward.description}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-indigo-600 mr-4">
                      {reward.pointsRequired} points required
                    </div>
                    <div className="text-sm font-medium text-gray-500 mr-4">
                      {reward.quantity} available
                    </div>
                    <Link
                      href={`/dashboard/rewards/${reward._id}/edit`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4 py-5 sm:px-6 text-center">
            <p className="text-sm text-gray-500">No rewards created yet. Create your first reward to get started.</p>
          </div>
        )}
      </div>
      
      {/* Recent Redemptions */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Redemptions</h3>
          <p className="mt-1 text-sm text-gray-500">Recent rewards claimed by participants</p>
        </div>
        
        {redemptions.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {redemptions.map((redemption) => (
              <li key={redemption._id.toString()} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {redemption.participantId?.name || 'Unknown Participant'} 
                      <span className="text-gray-500"> claimed </span>
                      {redemption.rewardId?.name || 'Unknown Reward'}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {new Date(redemption.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {redemption.status === 'pending' ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pending</span>
                    ) : redemption.status === 'fulfilled' ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Fulfilled</span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Cancelled</span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4 py-5 sm:px-6 text-center">
            <p className="text-sm text-gray-500">No redemptions yet.</p>
          </div>
        )}
      </div>
    </div>
  );
} 