'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import QRCode from 'react-qr-code';

interface Participant {
  _id: string;
  name: string;
  accessCode: string;
  totalRupiah: number;
}

interface AccessCodeGeneratorProps {
  roomId: string;
}

export default function AccessCodeGenerator({ roomId }: AccessCodeGeneratorProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newAccessCode, setNewAccessCode] = useState('');
  const [showQRCode, setShowQRCode] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    // Get the base URL for generating shareable links
    setBaseUrl(window.location.origin);
  }, []);

  const fetchAccessCodes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/rooms/${roomId}/access-codes`);
      const data = await response.json();
      
      if (response.ok) {
        setParticipants(data.participants || []);
      } else {
        toast.error(data.message || 'Failed to fetch access codes');
      }
    } catch (error) {
      toast.error('An error occurred while fetching access codes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccessCodes();
  }, [fetchAccessCodes]);

  const generateAccessCode = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/rooms/${roomId}/access-codes`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setNewAccessCode(data.accessCode);
        toast.success('Access code generated successfully');
      } else {
        toast.error(data.message || 'Failed to generate access code');
      }
    } catch (error) {
      toast.error('An error occurred while generating access code');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  // Function to generate direct access link
  const generateDirectLink = (accessCode: string) => {
    return `${baseUrl}/direct-access?room=${roomId}&code=${accessCode}`;
  };

  // Function to toggle QR code display
  const toggleQRCode = () => {
    setShowQRCode(!showQRCode);
  };

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-100 overflow-hidden mt-6">
      <div className="border-b border-gray-100 px-4 py-5 sm:px-6 bg-[#f0f2f5]">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Participant Access Codes</h3>
        <p className="mt-1 text-sm text-gray-500">
          Generate access codes for participants to join the game. Participants will need these codes to access the game.
        </p>
      </div>
      
      <div className="px-4 py-5 sm:p-6">
        <div className="flex flex-col md:flex-row gap-4 items-start mb-6">
          <button
            onClick={generateAccessCode}
            disabled={isGenerating}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#128C7E] hover:bg-[#075E54] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#128C7E] disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Generate New Access Code
              </>
            )}
          </button>
          
          {newAccessCode && (
            <div className="flex-1 bg-emerald-50 p-3 rounded-md border border-emerald-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-emerald-700">New Access Code:</p>
                  <p className="text-xl font-bold tracking-wider">{newAccessCode}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(newAccessCode)}
                    className="p-2 text-emerald-600 hover:text-emerald-800"
                    title="Copy code to clipboard"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  </button>
                  <button
                    onClick={() => copyToClipboard(generateDirectLink(newAccessCode))}
                    className="p-2 text-emerald-600 hover:text-emerald-800"
                    title="Copy direct access link"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </button>
                  <button
                    onClick={toggleQRCode}
                    className="p-2 text-emerald-600 hover:text-emerald-800"
                    title="Show/Hide QR Code"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </button>
                </div>
              </div>
              <p className="text-xs text-emerald-600 mt-1">
                Share this code, link, or QR code with a participant to allow them to join the game
              </p>
              
              {showQRCode && (
                <div className="mt-3 flex flex-col items-center p-3 bg-white rounded-md">
                  <QRCode
                    size={150}
                    value={generateDirectLink(newAccessCode)}
                    viewBox={`0 0 256 256`}
                  />
                  <p className="text-xs text-gray-500 mt-2">Scan this QR code to join the game</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-6">
          <h4 className="text-base font-medium text-gray-900 mb-3">Existing Participant Codes</h4>
          
          {isLoading ? (
            <div className="flex justify-center py-6">
              <svg className="animate-spin h-8 w-8 text-[#128C7E]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : participants.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Access Code
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Rupiah
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {participants.map((participant) => (
                    <tr key={participant._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {participant.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {participant.accessCode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Rp {participant.totalRupiah.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => copyToClipboard(participant.accessCode)}
                            className="text-[#128C7E] hover:text-[#075E54]"
                            title="Copy access code"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          </button>
                          <button
                            onClick={() => copyToClipboard(generateDirectLink(participant.accessCode))}
                            className="text-[#128C7E] hover:text-[#075E54]"
                            title="Copy direct access link"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              setNewAccessCode(participant.accessCode);
                              setShowQRCode(true);
                              const element = document.getElementById('qr-section');
                              if (element) {
                                element.scrollIntoView({ behavior: 'smooth' });
                              }
                            }}
                            className="text-[#128C7E] hover:text-[#075E54]"
                            title="Show QR Code"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-6 text-center text-gray-500 border border-dashed border-gray-300 rounded-lg">
              <p>No participant codes generated yet.</p>
              <p className="text-sm mt-1">Generate new codes for participants to join the game.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 