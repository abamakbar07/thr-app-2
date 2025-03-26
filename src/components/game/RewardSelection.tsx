'use client';

import { useState } from 'react';
import Image from 'next/image';
import { IReward } from '@/lib/db/models';

interface RewardSelectionProps {
  rewards: IReward[];
  participantId: string;
  participantPoints: number;
  onRewardClaim: (rewardId: string) => Promise<boolean>;
}

export function RewardSelection({
  rewards,
  participantId,
  participantPoints,
  onRewardClaim,
}: RewardSelectionProps) {
  const [claimingRewardId, setClaimingRewardId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Group rewards by tier
  const rewardsByTier = {
    bronze: rewards.filter(r => r.tier === 'bronze'),
    silver: rewards.filter(r => r.tier === 'silver'),
    gold: rewards.filter(r => r.tier === 'gold'),
  };
  
  const tierInfo = {
    bronze: { 
      color: 'bg-amber-600', 
      borderColor: 'border-amber-600',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
      label: 'Bronze' 
    },
    silver: { 
      color: 'bg-gray-400', 
      borderColor: 'border-gray-400',
      textColor: 'text-gray-700',
      bgColor: 'bg-gray-50',
      label: 'Silver' 
    },
    gold: { 
      color: 'bg-yellow-500', 
      borderColor: 'border-yellow-500',
      textColor: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      label: 'Gold' 
    },
  };
  
  const handleClaimReward = async (rewardId: string) => {
    setClaimingRewardId(rewardId);
    setSuccessMessage(null);
    setErrorMessage(null);
    
    try {
      const success = await onRewardClaim(rewardId);
      
      if (success) {
        const reward = rewards.find(r => r._id === rewardId);
        setSuccessMessage(`You have successfully claimed ${reward?.name}!`);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        setErrorMessage('Failed to claim reward. Please try again.');
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      setErrorMessage('An error occurred while claiming the reward.');
    } finally {
      setClaimingRewardId(null);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-center mb-2">Redeem THR Rewards</h2>
      <p className="text-center text-gray-600 mb-8">
        Use your points to claim exciting Eid rewards!
      </p>
      
      {/* Points indicator */}
      <div className="bg-white shadow-md rounded-lg p-4 mb-8 flex justify-center items-center">
        <div className="bg-emerald-100 px-6 py-3 rounded-full flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-bold text-lg text-emerald-800">{participantPoints} points available</span>
        </div>
      </div>
      
      {/* Success/Error messages */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-100 border border-green-200 text-green-700 rounded-lg text-center">
          {successMessage}
        </div>
      )}
      
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-100 border border-red-200 text-red-700 rounded-lg text-center">
          {errorMessage}
        </div>
      )}
      
      {/* Rewards by tier */}
      <div className="space-y-10">
        {Object.entries(tierInfo).map(([tier, info]) => (
          <div key={tier}>
            <div className="flex items-center mb-4">
              <div className={`w-10 h-1 ${info.color} rounded-full mr-3`}></div>
              <h3 className="text-xl font-semibold">{info.label} Rewards</h3>
            </div>
            
            {rewardsByTier[tier as keyof typeof rewardsByTier].length === 0 ? (
              <p className="text-gray-500 text-center py-4">No {tier} rewards available</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rewardsByTier[tier as keyof typeof rewardsByTier].map(reward => {
                  const isAffordable = participantPoints >= reward.rupiahRequired;
                  const isAvailable = reward.remainingQuantity > 0;
                  const canClaim = isAffordable && isAvailable;
                  
                  return (
                    <div 
                      key={reward._id} 
                      className={`border ${info.borderColor} rounded-lg overflow-hidden ${info.bgColor} transition-all duration-300 ${
                        canClaim ? 'hover:shadow-lg' : 'opacity-60'
                      }`}
                    >
                      <div className="h-40 relative">
                        {reward.imageUrl ? (
                          <Image
                            src={reward.imageUrl}
                            alt={reward.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center ${info.color}`}>
                            <span className="text-white text-lg font-bold">{reward.name}</span>
                          </div>
                        )}
                        <div className={`absolute top-2 right-2 ${info.color} text-white px-2 py-1 rounded-full text-xs font-medium`}>
                          {reward.rupiahRequired} pts
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <h4 className="font-semibold text-lg mb-1">{reward.name}</h4>
                        <p className="text-gray-600 text-sm mb-3">{reward.description}</p>
                        
                        <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                          <span>Remaining: {reward.remainingQuantity}</span>
                          <span className={info.textColor}>{reward.tier}</span>
                        </div>
                        
                        <button
                          onClick={() => handleClaimReward(reward._id!)}
                          disabled={!canClaim || claimingRewardId === reward._id}
                          className={`w-full py-2 rounded-md font-medium text-sm ${
                            canClaim
                              ? `bg-${tier}-100 hover:bg-${tier}-200 text-${tier}-800`
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          } transition-colors`}
                        >
                          {claimingRewardId === reward._id 
                            ? 'Processing...' 
                            : !isAvailable 
                              ? 'Sold Out' 
                              : !isAffordable 
                                ? `Need ${reward.rupiahRequired - participantPoints} more points` 
                                : 'Claim Reward'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 