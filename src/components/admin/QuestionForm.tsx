'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import QuestionSuggestions from './QuestionSuggestions';

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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Initialize form with empty values or existing question data
  const [formData, setFormData] = useState({
    text: questionData?.text || '',
    options: questionData?.options || ['', ''],
    correctOptionIndex: questionData?.correctOptionIndex || 0,
    rupiah: questionData?.rupiah || 1000,
    difficulty: questionData?.difficulty || 'bronze',
    category: questionData?.category || '',
    explanation: questionData?.explanation || '',
    isDisabled: questionData?.isDisabled || false,
    imageUrl: questionData?.imageUrl || '',
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: target.checked
      }));
    } else if (name === 'rupiah') {
      setFormData(prev => ({
        ...prev,
        [name]: Number(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
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
  
  const handleQuestionSelect = (questionData: any) => {
    setFormData({
      ...questionData,
      // Keep the roomId for the current room
      roomId,
      // Ensure rupiah is a number
      rupiah: Number(questionData.rupiah)
    });
    setShowSuggestions(false); // Hide suggestions after selection
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
          rupiah: Number(formData.rupiah)
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
    <div>
      {!questionData && (
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg px-4 py-2 text-sm font-medium inline-flex items-center transition-colors"
          >
            {showSuggestions ? 'Hide Suggestions' : 'Show Question Suggestions'}
            <svg className={`ml-2 h-5 w-5 transition-transform ${showSuggestions ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}

      {showSuggestions && !questionData && (
        <div className="mb-8">
          <QuestionSuggestions
            roomId={roomId}
            onQuestionSelect={handleQuestionSelect}
          />
        </div>
      )}

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
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Question text */}
            <div className="md:col-span-2">
              <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-1">
                Question Text <span className="text-red-500">*</span>
              </label>
              <textarea
                id="text"
                name="text"
                rows={3}
                value={formData.text}
                onChange={handleChange}
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Type your question here..."
              />
            </div>
            
            {/* Image URL */}
            <div className="md:col-span-2">
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Image URL (Optional)
              </label>
              <input
                type="url"
                id="imageUrl"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="https://example.com/image.jpg"
              />
              <p className="mt-1 text-xs text-gray-500">Provide a URL to an image that illustrates this question (if applicable)</p>
            </div>
            
            {/* Options */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Answer Options <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addOption}
                  disabled={formData.options.length >= 6}
                  className={`inline-flex items-center px-3 py-1 text-sm rounded-md ${
                    formData.options.length >= 6
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Add Option
                </button>
              </div>
              
              <div className="space-y-3">
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center">
                    <div className="flex-grow">
                      <div className="flex items-center">
                        <span className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full mr-2 font-medium ${
                          formData.correctOptionIndex === index ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </span>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder={`Option ${String.fromCharCode(65 + index)}`}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center ml-2">
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        disabled={formData.options.length <= 2}
                        className={`p-1 rounded-full ${
                          formData.options.length <= 2 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-500'
                        }`}
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                      
                      <div className="ml-2">
                        <input
                          type="radio"
                          name="correctOptionIndex"
                          id={`correctOption${index}`}
                          checked={formData.correctOptionIndex === index}
                          onChange={() => setFormData({ ...formData, correctOptionIndex: index })}
                          className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <label htmlFor={`correctOption${index}`} className="ml-1 text-xs text-gray-600">
                          Correct
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Difficulty & Reward */}
            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty Level <span className="text-red-500">*</span>
              </label>
              <select
                id="difficulty"
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="bronze">Bronze (Easy)</option>
                <option value="silver">Silver (Medium)</option>
                <option value="gold">Gold (Hard)</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="rupiah" className="block text-sm font-medium text-gray-700 mb-1">
                Reward (Rupiah) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="rupiah"
                name="rupiah"
                min="100"
                step="100"
                value={formData.rupiah}
                onChange={handleChange}
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            
            {/* Category & Status */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="e.g., Qur'an, Hadith, Sirah, Fiqh"
              />
            </div>
            
            <div className="flex items-center h-full pt-6">
              <label htmlFor="isDisabled" className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    id="isDisabled"
                    name="isDisabled"
                    checked={formData.isDisabled}
                    onChange={(e) => setFormData({ ...formData, isDisabled: e.target.checked })}
                    className="sr-only"
                  />
                  <div className={`block w-10 h-6 rounded-full transition ${formData.isDisabled ? 'bg-gray-400' : 'bg-green-400'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${formData.isDisabled ? '' : 'translate-x-full'}`}></div>
                </div>
                <div className="ml-3 text-sm">
                  <span className="font-medium text-gray-700">Disable question</span>
                  <p className="text-gray-500 text-xs">Disabled questions are not shown to participants</p>
                </div>
              </label>
            </div>
            
            {/* Explanation */}
            <div className="md:col-span-2">
              <label htmlFor="explanation" className="block text-sm font-medium text-gray-700 mb-1">
                Explanation
              </label>
              <textarea
                id="explanation"
                name="explanation"
                rows={3}
                value={formData.explanation}
                onChange={handleChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Explain why the correct answer is right (shown after answering)"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/rooms/${roomId}/questions`)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 inline-flex items-center"
          >
            {isLoading ? (
              <>
                <svg className="w-4 h-4 mr-2 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Save Question'
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 