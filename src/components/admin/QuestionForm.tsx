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
    rupiah: number;
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
  const [success, setSuccess] = useState<string | null>(null);
  
  // Initialize form with empty values or existing question data
  const [formData, setFormData] = useState({
    text: questionData?.text ?? '',
    options: questionData?.options ?? ['', '', '', ''],
    correctOptionIndex: questionData?.correctOptionIndex ?? 0,
    rupiah: questionData?.rupiah ?? 1000,
    difficulty: questionData?.difficulty ?? 'bronze',
    category: questionData?.category ?? '',
    explanation: questionData?.explanation ?? '',
    isDisabled: questionData?.isDisabled ?? false,
    imageUrl: questionData?.imageUrl ?? '',
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
  
  const addOption = () => {
    if (formData.options.length < 6) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, '']
      }));
    }
  };
  
  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      
      // Adjust correct option index if needed
      let newCorrectIndex = formData.correctOptionIndex;
      if (index === formData.correctOptionIndex) {
        newCorrectIndex = 0;
      } else if (index < formData.correctOptionIndex) {
        newCorrectIndex--;
      }
      
      setFormData(prev => ({
        ...prev,
        options: newOptions,
        correctOptionIndex: newCorrectIndex
      }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
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
      
      // Show success message
      setSuccess(questionData ? 'Question updated successfully!' : 'Question created successfully!');
      
      // After a delay, redirect
      setTimeout(() => {
        router.push(`/dashboard/rooms/${roomId}/questions`);
        router.refresh();
      }, 1500);
    } catch (err) {
      console.error('Error saving question:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-lg shadow-sm animate-fadeIn">
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
      
      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 rounded-lg shadow-sm animate-fadeIn">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Question Text */}
      <div className="bg-white p-6 rounded-xl shadow-sm transition-all hover:shadow-md">
        <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-2">Question Text</label>
        <textarea
          id="text"
          name="text"
          value={formData.text}
          onChange={handleChange}
          rows={3}
          required
          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition-all"
          placeholder="Type your question here..."
        />
      </div>
      
      {/* Options */}
      <div className="bg-white p-6 rounded-xl shadow-sm transition-all hover:shadow-md">
        <div className="flex justify-between items-center mb-4">
          <label className="block text-sm font-medium text-gray-700">Answer Options</label>
          <button
            type="button"
            onClick={addOption}
            disabled={formData.options.length >= 6}
            className="flex items-center text-xs font-medium text-indigo-600 bg-indigo-50 rounded-full px-3 py-1 hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Option
          </button>
        </div>
        
        <div className="space-y-3">
          {formData.options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className="flex-shrink-0">
                <input
                  type="radio"
                  id={`correctOption-${index}`}
                  name="correctOptionIndex"
                  value={index}
                  checked={formData.correctOptionIndex === index}
                  onChange={() => setFormData(prev => ({ ...prev, correctOptionIndex: index }))}
                  className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 cursor-pointer transition-all"
                />
              </div>
              <div className="flex-grow relative">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  required
                  placeholder={`Option ${index + 1}`}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition-all pr-10"
                />
                {formData.options.length > 2 && (
                  <button 
                    type="button"
                    onClick={() => removeOption(index)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">Select the radio button next to the correct answer</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Category */}
        <div className="bg-white p-6 rounded-xl shadow-sm transition-all hover:shadow-md">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <input
            type="text"
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            placeholder="e.g., Quran, Hadith, Fiqh, History"
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition-all"
          />
        </div>
        
        {/* Difficulty */}
        <div className="bg-white p-6 rounded-xl shadow-sm transition-all hover:shadow-md">
          <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
          <select
            id="difficulty"
            name="difficulty"
            value={formData.difficulty}
            onChange={handleChange}
            required
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition-all"
          >
            <option value="bronze">Bronze (Easy)</option>
            <option value="silver">Silver (Medium)</option>
            <option value="gold">Gold (Hard)</option>
          </select>
        </div>
      </div>
      
      {/* Rupiah */}
      <div className="bg-white p-6 rounded-xl shadow-sm transition-all hover:shadow-md">
        <label htmlFor="rupiah" className="block text-sm font-medium text-gray-700 mb-2">Rupiah Value</label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">Rp</span>
          </div>
          <input
            type="number"
            id="rupiah"
            name="rupiah"
            min="100"
            value={formData.rupiah}
            onChange={handleChange}
            required
            className="w-full rounded-lg border-gray-300 pl-12 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition-all"
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">Amount of Rupiah awarded for answering correctly</p>
      </div>
      
      {/* Explanation */}
      <div className="bg-white p-6 rounded-xl shadow-sm transition-all hover:shadow-md">
        <label htmlFor="explanation" className="block text-sm font-medium text-gray-700 mb-2">
          Explanation <span className="text-gray-500">(shown after answering)</span>
        </label>
        <textarea
          id="explanation"
          name="explanation"
          value={formData.explanation}
          onChange={handleChange}
          rows={3}
          required
          placeholder="Explain the correct answer..."
          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition-all"
        />
      </div>
      
      {/* Image URL (Optional) */}
      <div className="bg-white p-6 rounded-xl shadow-sm transition-all hover:shadow-md">
        <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
          Image URL <span className="text-gray-500">(optional)</span>
        </label>
        <input
          type="url"
          id="imageUrl"
          name="imageUrl"
          value={formData.imageUrl}
          onChange={handleChange}
          placeholder="https://example.com/image.jpg"
          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition-all"
        />
      </div>
      
      {/* Is Disabled */}
      <div className="bg-white p-6 rounded-xl shadow-sm transition-all hover:shadow-md">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="isDisabled"
              name="isDisabled"
              type="checkbox"
              checked={formData.isDisabled}
              onChange={handleChange}
              className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 transition-all"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="isDisabled" className="font-medium text-gray-700">Disable Question</label>
            <p className="text-gray-500">Disabled questions won't appear in the game</p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-4 mt-8">
        <button
          type="button"
          onClick={() => router.push(`/dashboard/rooms/${roomId}/questions`)}
          className="px-5 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-70"
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {questionData ? 'Saving...' : 'Creating...'}
            </span>
          ) : (
            questionData ? 'Save Question' : 'Create Question'
          )}
        </button>
      </div>
    </form>
  );
} 