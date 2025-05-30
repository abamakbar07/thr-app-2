'use client';

import { formatCurrency } from '@/lib/utils';

interface SocialShareButtonsProps {
  participantName: string;
  totalRupiah: number;
  participantId: string;
}

export function SocialShareButtons({ participantName, totalRupiah, participantId }: SocialShareButtonsProps) {
  // Generate the public certificate URL
  const publicURL = `${window.location.origin}/certificate/${participantId}`;

  const handleFacebookShare = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicURL)}`, '_blank');
  };

  const handleWhatsAppShare = () => {
    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(
        `${participantName} has earned ${formatCurrency(totalRupiah)} in the Islamic Trivia game! ${publicURL}`
      )}`,
      '_blank'
    );
  };

  const handleTwitterShare = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        `I earned ${formatCurrency(totalRupiah)} in the Islamic Trivia THR Challenge!`
      )}&url=${encodeURIComponent(publicURL)}`,
      '_blank'
    );
  };

  return (
    <div className="flex space-x-2">
      <button 
        className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700"
        onClick={handleFacebookShare}
      >
        <span className="sr-only">Facebook</span>
        f
      </button>
      <button 
        className="w-10 h-10 bg-[#25D366] text-white rounded-full flex items-center justify-center hover:bg-green-600"
        onClick={handleWhatsAppShare}
      >
        <span className="sr-only">WhatsApp</span>
        w
      </button>
      <button 
        className="w-10 h-10 bg-blue-400 text-white rounded-full flex items-center justify-center hover:bg-blue-500"
        onClick={handleTwitterShare}
      >
        <span className="sr-only">Twitter</span>
        t
      </button>
    </div>
  );
} 