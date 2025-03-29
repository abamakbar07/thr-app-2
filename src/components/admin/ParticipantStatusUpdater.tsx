'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface ParticipantStatusUpdaterProps {
  participantId: string;
  initialStatus: 'unclaimed' | 'processing' | 'claimed';
  onStatusUpdated?: (newStatus: string) => void;
}

export default function ParticipantStatusUpdater({
  participantId,
  initialStatus,
  onStatusUpdated
}: ParticipantStatusUpdaterProps) {
  const [status, setStatus] = useState<string>(initialStatus);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  
  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status) return;
    
    // Confirm before setting to claimed as it will create a redemption record
    if (newStatus === 'claimed') {
      if (!confirm('Setting status to "Claimed" will automatically create a system redemption record. Continue?')) {
        return;
      }
    }
    
    setIsUpdating(true);
    const toastId = toast.loading('Updating status...');
    
    try {
      const response = await fetch('/api/participants/update-claim-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId,
          claimStatus: newStatus,
          notes: `Status manually updated by admin to ${newStatus}`
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus(newStatus);
        
        // Show appropriate toast messages
        if (newStatus === 'claimed') {
          toast.success('Status updated & redemption record created', { id: toastId });
        } else {
          toast.success(`Status updated to ${newStatus}`, { id: toastId });
        }
        
        if (onStatusUpdated) {
          onStatusUpdated(newStatus);
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update status', { id: toastId });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('An error occurred while updating', { id: toastId });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const getStatusColor = (statusValue: string) => {
    return statusValue === 'claimed' ? 'bg-green-100 text-green-800' : 
           statusValue === 'processing' ? 'bg-yellow-100 text-yellow-800' : 
           'bg-gray-100 text-gray-800';
  };
  
  return (
    <div className="space-y-2">
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(status)}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
      
      <select 
        value={status}
        onChange={(e) => handleStatusChange(e.target.value)}
        disabled={isUpdating}
        className={`block w-full text-xs border-gray-300 rounded-md shadow-sm focus:ring-[#128C7E] focus:border-[#128C7E] ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <option value="unclaimed">Unclaimed</option>
        <option value="processing">Processing</option>
        <option value="claimed">Claimed</option>
      </select>
    </div>
  );
} 