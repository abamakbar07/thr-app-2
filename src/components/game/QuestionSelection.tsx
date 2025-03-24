'use client';

import { useState, useEffect } from 'react';
import { IQuestion } from '@/lib/db/models';

interface QuestionSelectionProps {
  questions: IQuestion[];
  onSelectQuestion: (questionId: string) => void;
}

export function QuestionSelection({ questions, onSelectQuestion }: QuestionSelectionProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  useEffect(() => {
    // Extract unique categories from questions
    const uniqueCategories = [...new Set(questions.map(q => q.category))];
    setCategories(uniqueCategories);
  }, [questions]);
  
  // Filter questions by selected category
  const filteredQuestions = selectedCategory === 'all'
    ? questions
    : questions.filter(q => q.category === selectedCategory);
  
  // Group questions by difficulty
  const questionsByDifficulty = {
    bronze: filteredQuestions.filter(q => q.difficulty === 'bronze'),
    silver: filteredQuestions.filter(q => q.difficulty === 'silver'),
    gold: filteredQuestions.filter(q => q.difficulty === 'gold'),
  };
  
  const difficultyInfo = {
    bronze: { color: 'from-amber-600 to-amber-700', label: 'Bronze', value: 'bronze' },
    silver: { color: 'from-gray-400 to-gray-500', label: 'Silver', value: 'silver' },
    gold: { color: 'from-yellow-500 to-yellow-600', label: 'Gold', value: 'gold' },
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-center mb-8">Select a Question</h2>
      
      {/* Category filter */}
      <div className="mb-8">
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Categories
          </button>
          
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      
      {/* Questions by difficulty */}
      <div className="space-y-8">
        {Object.entries(difficultyInfo).map(([key, { color, label, value }]) => (
          <div key={key}>
            <h3 className="text-xl font-semibold mb-4">{label} Questions</h3>
            
            {questionsByDifficulty[value as keyof typeof questionsByDifficulty].length === 0 ? (
              <p className="text-gray-500 text-center py-4">No {label.toLowerCase()} questions available</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {questionsByDifficulty[value as keyof typeof questionsByDifficulty].map(question => (
                  <button
                    key={question._id}
                    onClick={() => onSelectQuestion(question._id!)}
                    disabled={question.isDisabled}
                    className={`block w-full h-32 rounded-lg bg-gradient-to-r ${color} text-white p-4 shadow hover:shadow-lg transition-shadow 
                      ${question.isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex flex-col h-full justify-between">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-medium px-2 py-1 bg-white/20 rounded-full">
                          {question.category}
                        </span>
                        <span className="font-bold">{question.points}pts</span>
                      </div>
                      <div className="line-clamp-2 text-sm font-medium">{question.text}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 