'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface AccessCode {
  _id: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  usedBy: {
    name: string;
    email: string;
  } | null;
  usedAt: string | null;
}

interface AccessCodeManagerProps {
  roomId: string;
}

export default function AccessCodeManager({ roomId }: AccessCodeManagerProps) {
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([]);
  const [codeCount, setCodeCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchAccessCodes();
  }, [roomId, filter]);

  const fetchAccessCodes = async () => {
    setLoading(true);
    try {
      const status = filter !== "all" ? filter : "";
      const response = await fetch(`/api/rooms/${roomId}/access-codes?status=${status}`);
      if (!response.ok) throw new Error("Failed to fetch access codes");
      const data = await response.json();
      setAccessCodes(data);
    } catch (error) {
      console.error("Error fetching access codes:", error);
      toast.error("Failed to load access codes");
    } finally {
      setLoading(false);
    }
  };

  const generateCodes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/rooms/${roomId}/access-codes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: codeCount }),
      });

      if (!response.ok) throw new Error("Failed to generate access codes");
      
      toast.success(`${codeCount} access codes generated successfully`);
      fetchAccessCodes();
    } catch (error) {
      console.error("Error generating access codes:", error);
      toast.error("Failed to generate access codes");
    } finally {
      setLoading(false);
    }
  };

  const toggleCodeStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}/access-codes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) throw new Error("Failed to toggle access code status");
      
      toast.success("Access code status updated");
      fetchAccessCodes();
    } catch (error) {
      console.error("Error toggling access code status:", error);
      toast.error("Failed to update access code status");
    }
  };

  const deleteCode = async (id: string) => {
    if (!confirm("Are you sure you want to delete this access code?")) return;
    
    try {
      const response = await fetch(`/api/rooms/${roomId}/access-codes/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete access code");
      
      toast.success("Access code deleted successfully");
      fetchAccessCodes();
    } catch (error) {
      console.error("Error deleting access code:", error);
      toast.error("Failed to delete access code");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="border-t border-gray-100 px-4 py-5 sm:px-6 bg-[#f0f2f5]">
      <h3 className="text-lg leading-6 font-medium text-gray-900">Access Codes Management</h3>
      <p className="mt-1 text-sm text-gray-500">
        Generate access codes for participants to join this room. Participants will need both the room code and an access code.
      </p>
      
      <div className="mt-4">
        <div className="flex flex-col md:flex-row mb-6 gap-4 items-end bg-white p-4 rounded-lg">
          <div className="w-full md:w-1/3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Codes to Generate
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={codeCount}
              onChange={(e) => setCodeCount(Number(e.target.value))}
              className="w-full p-2 border rounded"
            />
          </div>
          <button
            onClick={generateCodes}
            disabled={loading}
            className="bg-[#128C7E] text-white py-2 px-4 rounded hover:bg-[#075E54] disabled:opacity-75"
          >
            Generate Access Codes
          </button>
          
          <div className="ml-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="all">All Codes</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : (
          <>
            {accessCodes.length === 0 ? (
              <div className="text-center py-10 text-gray-500 bg-white rounded-lg">
                No access codes found
              </div>
            ) : (
              <div className="overflow-x-auto bg-white rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created At
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Used By
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Used At
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {accessCodes.map((code) => (
                      <tr key={code._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-mono flex items-center">
                            {code.code}
                            <button
                              onClick={() => copyToClipboard(code.code)}
                              className="ml-2 text-gray-400 hover:text-gray-600"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${code.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {code.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(code.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {code.usedBy ? code.usedBy.name : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {code.usedAt ? formatDate(code.usedAt) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => toggleCodeStatus(code._id, code.isActive)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            {code.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => deleteCode(code._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 