'use client';

import { useState, useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';

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
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  
  const { ref, inView } = useInView({
    threshold: 0.1,
  });

  const LIMIT = 5;

  const fetchSuggestions = useCallback(async (refresh = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const skipValue = refresh ? 0 : skip;
      const queryParams = new URLSearchParams({
        currentRoomId: roomId,
        limit: LIMIT.toString(),
        skip: skipValue.toString(),
        random: 'true' // Add random parameter to get randomized results
      });
      
      if (category) queryParams.append('category', category);
      if (difficulty) queryParams.append('difficulty', difficulty);
      
      const response = await fetch(`/api/questions/suggestions?${queryParams}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch suggestions');
      }
      
      if (refresh) {
        setSuggestions(data.questions);
      } else {
        setSuggestions(prev => [...prev, ...data.questions]);
      }
      
      setHasMore(data.hasMore);
      if (!refresh) {
        setSkip(prev => prev + data.questions.length);
      } else if (data.questions.length > 0) {
        setSkip(data.questions.length);
      }
    } catch (err) {
      console.error('Error fetching question suggestions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load suggestions');
    } finally {
      setIsLoading(false);
    }
  }, [roomId, skip, category, difficulty]);

  const refreshSuggestions = () => {
    setSkip(0);
    fetchSuggestions(true);
  };

  const handleQuestionSelect = (question: QuestionSuggestion) => {
    // Remove room-specific info before passing to parent
    const { roomId, _id, ...questionData } = question;
    onQuestionSelect(questionData);
  };

  // Load initial suggestions
  useEffect(() => {
    fetchSuggestions(true);
  }, []);

  // Load more when scrolling to the end
  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      fetchSuggestions();
    }
  }, [inView, hasMore, isLoading, fetchSuggestions]);

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
        {suggestions.length > 0 ? (
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
                  Rp {question.rupiah.toLocaleString()}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="px-4 py-6 text-center text-gray-500">
            {isLoading ? 'Loading suggestions...' : 'No question suggestions available'}
          </div>
        )}
        
        {hasMore && (
          <div 
            ref={ref} 
            className="p-4 text-center text-sm text-gray-500"
          >
            {isLoading && 'Loading more...'}
          </div>
        )}
      </div>
    </div>
  );
} 