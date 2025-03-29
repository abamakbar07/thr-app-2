'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface BatchStatusUpdaterProps {
  roomId: string;
  onComplete?: () => void;
}

export default function BatchStatusUpdater({ roomId, onComplete }: BatchStatusUpdaterProps) {
  const [newStatus, setNewStatus] = useState<string>('processing');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [updateType, setUpdateType] = useState<string>('unclaimed'); // 'unclaimed', 'all'
  
  const handleBatchUpdate = async () => {
    let confirmMessage = `Are you sure you want to update all ${updateType === 'all' ? '' : updateType + ' '}participants in this room to "${newStatus}" status?`;
    
    // Add warning about redemptions if setting to claimed
    if (newStatus === 'claimed') {
      confirmMessage += '\n\nThis will automatically create system redemption records for all affected participants who don\'t already have one.';
    }
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    setIsUpdating(true);
    const toastId = toast.loading('Updating participants...');
    
    try {
      const response = await fetch('/api/participants/batch-update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          targetStatus: updateType === 'all' ? null : updateType,
          newStatus,
          notes: `Batch updated by admin to ${newStatus}`,
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (newStatus === 'claimed' && result.redemptionsCreated) {
          toast.success(`Updated ${result.updatedCount} participants and created redemption records`, { id: toastId });
        } else {
          toast.success(`Updated ${result.updatedCount} participants to "${newStatus}"`, { id: toastId });
        }
        
        if (onComplete) {
          onComplete();
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update participants', { id: toastId });
      }
    } catch (error) {
      console.error('Error batch updating participants:', error);
      toast.error('An error occurred during the update', { id: toastId });
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-100 overflow-hidden">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6 bg-[#f0f2f5]">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Batch Update THR Status</h3>
        <p className="mt-1 text-sm text-gray-500">Update status for multiple participants at once</p>
      </div>
      
      <div className="px-4 py-5 sm:p-6">
        <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-3 sm:gap-x-4">
          <div>
            <label htmlFor="updateType" className="block text-sm font-medium text-gray-700">
              Participants to Update
            </label>
            <select
              id="updateType"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
              value={updateType}
              onChange={(e) => setUpdateType(e.target.value)}
              disabled={isUpdating}
            >
              <option value="unclaimed">Only Unclaimed</option>
              <option value="processing">Only Processing</option>
              <option value="all">All Participants</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="newStatus" className="block text-sm font-medium text-gray-700">
              New Status
            </label>
            <select
              id="newStatus"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              disabled={isUpdating}
            >
              <option value="unclaimed">Unclaimed</option>
              <option value="processing">Processing</option>
              <option value="claimed">Claimed</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleBatchUpdate}
              disabled={isUpdating}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#128C7E] hover:bg-[#075E54] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#128C7E] ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isUpdating ? 'Updating...' : 'Update All'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 