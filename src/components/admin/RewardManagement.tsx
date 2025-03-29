'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface Participant {
  _id: string;
  name: string;
  totalRupiah: number;
}

interface Reward {
  _id: string;
  name: string;
  rupiahRequired: number;
  remainingQuantity: number;
}

interface Redemption {
  _id: string;
  participantId: string;
  participantName?: string;
  rewardId: string;
  rewardName?: string;
  rupiahSpent: number;
  status: 'pending' | 'fulfilled' | 'cancelled';
  claimedAt: string;
}

interface RewardManagementProps {
  roomId: string;
}

export default function RewardManagement({ roomId }: RewardManagementProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedParticipant, setSelectedParticipant] = useState<string>('');
  const [selectedReward, setSelectedReward] = useState<string>('');
  const [rupiahAdjustment, setRupiahAdjustment] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch participants in this room
        const participantsRes = await fetch(`/api/rooms/${roomId}/participants`);
        const participantsData = await participantsRes.json();
        
        // Fetch rewards for this room
        const rewardsRes = await fetch(`/api/rooms/${roomId}/rewards`);
        const rewardsData = await rewardsRes.json();
        
        // Fetch redemptions for this room
        const redemptionsRes = await fetch(`/api/rooms/${roomId}/redemptions`);
        const redemptionsData = await redemptionsRes.json();
        
        setParticipants(participantsData.participants || []);
        setRewards(rewardsData.rewards || []);
        setRedemptions(redemptionsData.redemptions || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load reward data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Set polling interval to refresh data
    const interval = setInterval(() => fetchData(), 30000);
    return () => clearInterval(interval);
  }, [roomId]);

  // Handle reward redemption
  const handleRedeemReward = async () => {
    if (!selectedParticipant || !selectedReward) {
      toast.error('Please select both participant and reward');
      return;
    }
    
    try {
      const response = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId: selectedParticipant,
          rewardId: selectedReward,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Reward successfully redeemed!');
        
        // Refresh data
        const participantsRes = await fetch(`/api/rooms/${roomId}/participants`);
        const participantsData = await participantsRes.json();
        setParticipants(participantsData.participants || []);
        
        const redemptionsRes = await fetch(`/api/rooms/${roomId}/redemptions`);
        const redemptionsData = await redemptionsRes.json();
        setRedemptions(redemptionsData.redemptions || []);
        
        // Reset selections
        setSelectedParticipant('');
        setSelectedReward('');
      } else {
        toast.error(data.error || 'Failed to redeem reward');
      }
    } catch (error) {
      console.error('Error redeeming reward:', error);
      toast.error('Failed to process redemption');
    }
  };

  // Handle THR adjustment
  const handleAdjustTHR = async () => {
    if (!selectedParticipant || !rupiahAdjustment) {
      toast.error('Please select a participant and enter an adjustment amount');
      return;
    }
    
    try {
      const response = await fetch('/api/participants/adjust-thr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId: selectedParticipant,
          adjustment: rupiahAdjustment,
          reason: adjustmentReason || 'Manual adjustment by admin',
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(`THR adjusted successfully! ${rupiahAdjustment > 0 ? 'Added' : 'Deducted'} ${Math.abs(rupiahAdjustment)} Rupiah`);
        
        // Refresh participants data
        const participantsRes = await fetch(`/api/rooms/${roomId}/participants`);
        const participantsData = await participantsRes.json();
        setParticipants(participantsData.participants || []);
        
        // Reset form
        setRupiahAdjustment(0);
        setAdjustmentReason('');
      } else {
        toast.error(data.error || 'Failed to adjust THR');
      }
    } catch (error) {
      console.error('Error adjusting THR:', error);
      toast.error('Failed to process THR adjustment');
    }
  };

  // Handle redemption status update
  const handleUpdateRedemptionStatus = async (redemptionId: string, newStatus: 'fulfilled' | 'cancelled') => {
    try {
      const response = await fetch(`/api/redemptions/${redemptionId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(`Redemption marked as ${newStatus}`);
        
        // Update redemptions locally
        setRedemptions(prev => 
          prev.map(r => 
            r._id === redemptionId ? { ...r, status: newStatus } : r
          )
        );
      } else {
        toast.error(data.error || `Failed to update redemption status`);
      }
    } catch (error) {
      console.error('Error updating redemption status:', error);
      toast.error('Failed to update redemption status');
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* THR Adjustment Section */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-100 overflow-hidden">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6 bg-[#f0f2f5]">
          <h3 className="text-lg leading-6 font-medium text-gray-900">THR Adjustment</h3>
          <p className="mt-1 text-sm text-gray-500">Manually adjust THR balance for participants</p>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-4">
            <div>
              <label htmlFor="participant" className="block text-sm font-medium text-gray-700">
                Select Participant
              </label>
              <select
                id="participant"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={selectedParticipant}
                onChange={(e) => setSelectedParticipant(e.target.value)}
              >
                <option value="">Select a participant</option>
                {participants.map((participant) => (
                  <option key={participant._id} value={participant._id}>
                    {participant.name} - Current THR: {participant.totalRupiah} Rupiah
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="adjustment" className="block text-sm font-medium text-gray-700">
                Adjustment Amount (Rupiah)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="number"
                  id="adjustment"
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md"
                  placeholder="0"
                  value={rupiahAdjustment}
                  onChange={(e) => setRupiahAdjustment(parseInt(e.target.value) || 0)}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">Rp</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Enter negative value to deduct THR
              </p>
            </div>
            
            <div className="sm:col-span-2">
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                Reason for Adjustment (Optional)
              </label>
              <textarea
                id="reason"
                rows={2}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Enter reason for this adjustment"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
              />
            </div>
          </div>
          
          <div className="mt-4">
            <button
              type="button"
              onClick={handleAdjustTHR}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Apply Adjustment
            </button>
          </div>
        </div>
      </div>
      
      {/* Reward Redemption Section */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-100 overflow-hidden">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6 bg-[#f0f2f5]">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Reward Redemption</h3>
          <p className="mt-1 text-sm text-gray-500">Redeem rewards on behalf of participants</p>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-4">
            <div>
              <label htmlFor="participant-redeem" className="block text-sm font-medium text-gray-700">
                Select Participant
              </label>
              <select
                id="participant-redeem"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={selectedParticipant}
                onChange={(e) => setSelectedParticipant(e.target.value)}
              >
                <option value="">Select a participant</option>
                {participants.map((participant) => (
                  <option key={participant._id} value={participant._id}>
                    {participant.name} - Available: {participant.totalRupiah} Rupiah
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="reward" className="block text-sm font-medium text-gray-700">
                Select Reward
              </label>
              <select
                id="reward"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={selectedReward}
                onChange={(e) => setSelectedReward(e.target.value)}
              >
                <option value="">Select a reward</option>
                {rewards.map((reward) => (
                  <option 
                    key={reward._id} 
                    value={reward._id}
                    disabled={reward.remainingQuantity <= 0}
                  >
                    {reward.name} - {reward.rupiahRequired} Rupiah {reward.remainingQuantity <= 0 ? '(Out of stock)' : `(${reward.remainingQuantity} left)`}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-4">
            <button
              type="button"
              onClick={handleRedeemReward}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#128C7E] hover:bg-[#075E54] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#128C7E]"
            >
              Redeem Reward
            </button>
          </div>
        </div>
      </div>
      
      {/* Recent Redemptions */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-100 overflow-hidden">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6 bg-[#f0f2f5]">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Redemptions</h3>
          <p className="mt-1 text-sm text-gray-500">Recent reward redemptions in this room</p>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          {redemptions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Participant
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reward
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {redemptions.map((redemption) => (
                    <tr key={redemption._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {redemption.participantName || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {redemption.rewardName || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {redemption.rupiahSpent} Rp
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${redemption.status === 'fulfilled' ? 'bg-green-100 text-green-800' : 
                            redemption.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'}`}>
                          {redemption.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(redemption.claimedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {redemption.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleUpdateRedemptionStatus(redemption._id, 'fulfilled')}
                              className="text-green-600 hover:text-green-900"
                            >
                              Fulfill
                            </button>
                            <button
                              onClick={() => handleUpdateRedemptionStatus(redemption._id, 'cancelled')}
                              className="text-red-600 hover:text-red-900"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No redemptions yet in this room</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 