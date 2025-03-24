'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface QuestionFormProps {
  roomId: string;
  questionData?: {
    _id: string;
    text: string;
    options: string[];
    correctOptionIndex: number;
    points: number;
    difficulty: 'bronze' | 'silver' | 'gold';
    category: string;
    explanation: string;
    isDisabled: boolean;
    imageUrl?: string;
  };
}

export default function QuestionForm({ roomId, questionData }: QuestionFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize form with empty values or existing question data
  const [formData, setFormData] = useState({
    text: questionData?.text || '',
    options: questionData?.options || ['', '', '', ''],
    correctOptionIndex: questionData?.correctOptionIndex ?? 0,
    points: questionData?.points || 10,
    difficulty: questionData?.difficulty || 'bronze',
    category: questionData?.category || '',
    explanation: questionData?.explanation || '',
    isDisabled: questionData?.isDisabled || false,
    imageUrl: questionData?.imageUrl || '',
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : type === 'number' 
          ? Number(value) 
          : value
    }));
  };
  
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    
    setFormData(prev => ({
      ...prev,
      options: newOptions
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Validate that options are not empty
    if (formData.options.some(option => option.trim() === '')) {
      setError('All options must be filled in');
      setIsLoading(false);
      return;
    }
    
    try {
      const url = questionData 
        ? `/api/rooms/${roomId}/questions/${questionData._id}` 
        : `/api/rooms/${roomId}/questions`;
      
      const method = questionData ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          roomId,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save question');
      }
      
      // Successfully created/updated the question
      router.push(`/dashboard/rooms/${roomId}/questions`);
      router.refresh();
    } catch (err) {
      console.error('Error saving question:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Question Text */}
      <div>
        <label htmlFor="text" className="block text-sm font-medium text-gray-700">Question Text</label>
        <textarea
          id="text"
          name="text"
          value={formData.text}
          onChange={handleChange}
          rows={3}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      
      {/* Options */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Options</label>
        
        {formData.options.map((option, index) => (
          <div key={index} className="flex items-center">
            <input
              type="radio"
              id={`correctOption-${index}`}
              name="correctOptionIndex"
              value={index}
              checked={formData.correctOptionIndex === index}
              onChange={() => setFormData(prev => ({ ...prev, correctOptionIndex: index }))}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            <input
              type="text"
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              required
              placeholder={`Option ${index + 1}`}
              className="ml-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        ))}
        <p className="text-xs text-gray-500">Select the radio button next to the correct answer</p>
      </div>
      
      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
        <input
          type="text"
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
          placeholder="e.g., Quran, Hadith, Fiqh, History"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      
      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
        {/* Difficulty */}
        <div>
          <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700">Difficulty</label>
          <select
            id="difficulty"
            name="difficulty"
            value={formData.difficulty}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="bronze">Bronze (Easy)</option>
            <option value="silver">Silver (Medium)</option>
            <option value="gold">Gold (Hard)</option>
          </select>
        </div>
        
        {/* Points */}
        <div>
          <label htmlFor="points" className="block text-sm font-medium text-gray-700">Points</label>
          <input
            type="number"
            id="points"
            name="points"
            value={formData.points}
            onChange={handleChange}
            min={5}
            max={100}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>
      
      {/* Explanation */}
      <div>
        <label htmlFor="explanation" className="block text-sm font-medium text-gray-700">
          Explanation <span className="text-gray-500">(shown after answering)</span>
        </label>
        <textarea
          id="explanation"
          name="explanation"
          value={formData.explanation}
          onChange={handleChange}
          rows={3}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      
      {/* Image URL (Optional) */}
      <div>
        <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
          Image URL <span className="text-gray-500">(optional)</span>
        </label>
        <input
          type="url"
          id="imageUrl"
          name="imageUrl"
          value={formData.imageUrl}
          onChange={handleChange}
          placeholder="https://example.com/image.jpg"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      
      {/* Is Disabled */}
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id="isDisabled"
            name="isDisabled"
            type="checkbox"
            checked={formData.isDisabled}
            onChange={handleChange}
            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor="isDisabled" className="font-medium text-gray-700">Disable Question</label>
          <p className="text-gray-500">Disabled questions won't appear in the game</p>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => router.push(`/dashboard/rooms/${roomId}/questions`)}
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {isLoading ? (questionData ? 'Saving...' : 'Creating...') : (questionData ? 'Save Question' : 'Create Question')}
        </button>
      </div>
    </form>
  );
} 