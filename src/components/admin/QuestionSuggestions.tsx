'use client';

import { useState, useEffect, useCallback } from 'react';

interface QuestionSuggestionProps {
  roomId: string;
  onQuestionSelect: (questionData: any) => void;
}

interface QuestionSuggestion {
  _id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  rupiah: number;
  difficulty: 'bronze' | 'silver' | 'gold';
  category: string;
  explanation: string;
  isDisabled: boolean;
  imageUrl?: string;
  roomId: {
    _id: string;
    name: string;
  };
}

export default function QuestionSuggestions({ roomId, onQuestionSelect }: QuestionSuggestionProps) {
  const [suggestions, setSuggestions] = useState<QuestionSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');

  const LIMIT = 5;

  const fetchSuggestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams({
        currentRoomId: roomId,
        limit: LIMIT.toString(),
        random: 'true' // Always get random results
      });
      
      if (category) queryParams.append('category', category);
      if (difficulty) queryParams.append('difficulty', difficulty);
      
      const response = await fetch(`/api/questions/suggestions?${queryParams}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch suggestions');
      }
      
      setSuggestions(data.questions);
    } catch (err) {
      console.error('Error fetching question suggestions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load suggestions');
    } finally {
      setIsLoading(false);
    }
  }, [roomId, category, difficulty]);

  const refreshSuggestions = () => {
    fetchSuggestions();
  };

  const handleQuestionSelect = (question: QuestionSuggestion) => {
    // Remove room-specific info before passing to parent
    const { roomId, _id, ...questionData } = question;
    onQuestionSelect(questionData);
  };

  // Load initial suggestions
  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      <div className="bg-indigo-50 px-4 py-3 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-indigo-800">Question Suggestions</h3>
          <button
            onClick={refreshSuggestions}
            disabled={isLoading}
            className="px-3 py-1 text-xs rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors"
          >
            {isLoading ? 'Loading...' : 'Refresh Suggestions'}
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Select a question from other rooms to use as a template
        </p>
      </div>
      
      <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-wrap gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-md border-gray-300 text-xs py-1 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          >
            <option value="">All Categories</option>
            <option value="Quran">Quran</option>
            <option value="Hadith">Hadith</option>
            <option value="Fiqh">Fiqh</option>
            <option value="History">History</option>
            <option value="General">General</option>
          </select>
          
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="rounded-md border-gray-300 text-xs py-1 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          >
            <option value="">All Difficulties</option>
            <option value="bronze">Bronze (Easy)</option>
            <option value="silver">Silver (Medium)</option>
            <option value="gold">Gold (Hard)</option>
          </select>
          
          <button
            onClick={refreshSuggestions}
            className="ml-auto rounded-md bg-white px-2 py-1 text-xs border border-gray-300 hover:bg-gray-50"
          >
            Apply Filters
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
            <p className="mt-2 text-sm text-gray-500">Loading suggestions...</p>
          </div>
        ) : suggestions.length > 0 ? (
          suggestions.map((question) => (
            <div 
              key={question._id} 
              className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => handleQuestionSelect(question)}
            >
              <div className="flex justify-between">
                <h4 className="font-medium text-gray-900">{question.text}</h4>
                <button 
                  className="text-xs bg-indigo-50 text-indigo-600 rounded-full px-2 py-1 hover:bg-indigo-100 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuestionSelect(question);
                  }}
                >
                  Use This
                </button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span className="bg-gray-100 px-2 py-1 rounded">
                  From: {question.roomId.name}
                </span>
                <span>
                  Category: {question.category}
                </span>
                <span className={`px-2 py-1 rounded ${
                  question.difficulty === 'bronze' 
                    ? 'bg-amber-100 text-amber-800' 
                    : question.difficulty === 'silver'
                    ? 'bg-gray-200 text-gray-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                </span>
                <span>
                  Rp {question.rupiah}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="px-4 py-12 text-center text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No questions available</h3>
            <p className="mt-1 text-xs text-gray-500">
              Try different filters or create questions in other rooms first
            </p>
          </div>
        )}
      </div>
      
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-center">
        <button
          onClick={refreshSuggestions}
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </>
          ) : (
            <>
              <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Show New Suggestions
            </>
          )}
        </button>
      </div>
    </div>
  );
} 