'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import QuestionSuggestions from './QuestionSuggestions';

interface QuestionImportProps {
  roomId: string;
}

export default function QuestionImport({ roomId }: QuestionImportProps) {
  const router = useRouter();
  const [selectedQuestions, setSelectedQuestions] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleQuestionSelect = (questionData: any) => {
    // Check if question is already selected (by matching text)
    const exists = selectedQuestions.some(q => q.text === questionData.text);
    
    if (!exists) {
      setSelectedQuestions(prev => [...prev, questionData]);
    }
  };

  const removeSelectedQuestion = (index: number) => {
    setSelectedQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleImport = async () => {
    if (selectedQuestions.length === 0) {
      setError('Please select at least one question to import');
      return;
    }

    setIsImporting(true);
    setError(null);
    setSuccess(null);

    try {
      // Create a copy of each selected question for the new room
      const promises = selectedQuestions.map(question => 
        fetch(`/api/rooms/${roomId}/questions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...question,
            roomId,
          }),
        })
      );

      const responses = await Promise.all(promises);
      
      // Check if all imports were successful
      const allSuccessful = responses.every(response => response.ok);
      
      if (!allSuccessful) {
        throw new Error('Some questions failed to import');
      }
      
      setSuccess(`Successfully imported ${selectedQuestions.length} questions`);
      setSelectedQuestions([]);
      
      // After a delay, redirect back to questions page
      setTimeout(() => {
        router.push(`/dashboard/rooms/${roomId}/questions`);
        router.refresh();
      }, 2000);
    } catch (err) {
      console.error('Error importing questions:', err);
      setError(err instanceof Error ? err.message : 'Failed to import questions');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Available Questions</h3>
          <QuestionSuggestions
            roomId={roomId}
            onQuestionSelect={handleQuestionSelect}
          />
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Selected Questions ({selectedQuestions.length})</h3>
            <button
              type="button"
              onClick={handleImport}
              disabled={isImporting || selectedQuestions.length === 0}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Importing...
                </span>
              ) : (
                'Import Selected Questions'
              )}
            </button>
          </div>
          
          {selectedQuestions.length > 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <ul className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
                {selectedQuestions.map((question, index) => (
                  <li key={index} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between">
                      <div className="flex-1 mr-4">
                        <p className="font-medium text-gray-900">{question.text}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
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
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSelectedQuestion(index)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-500">No questions selected</p>
              <p className="text-sm text-gray-400 mt-2">
                Click on a question from the suggestions to add it here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 