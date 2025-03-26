'use client';

import { useState, useEffect } from 'react';
import { IQuestion } from '@/lib/db/models';
import Image from 'next/image';

interface EnhancedQuestion extends IQuestion {
  status?: 'available' | 'answered-by-others' | 'correct' | 'incorrect';
  participantAnswer?: {
    isCorrect: boolean;
    selectedOption: number;
  } | null;
}

interface QuestionSelectionProps {
  questions: EnhancedQuestion[];
  onSelectQuestion: (questionId: string) => void;
  participantName: string;
  onLogout: () => void;
}

export function QuestionSelection({ 
  questions, 
  onSelectQuestion, 
  participantName,
  onLogout
}: QuestionSelectionProps) {
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
    bronze: { 
      color: 'from-amber-600 to-amber-700', 
      bgColor: 'bg-amber-100', 
      textColor: 'text-amber-800',
      borderColor: 'border-amber-300',
      icon: '🥉',
      label: 'Bronze', 
      value: 'bronze' 
    },
    silver: { 
      color: 'from-gray-400 to-gray-500', 
      bgColor: 'bg-gray-100', 
      textColor: 'text-gray-800',
      borderColor: 'border-gray-300',
      icon: '🥈',
      label: 'Silver', 
      value: 'silver' 
    },
    gold: { 
      color: 'from-yellow-500 to-yellow-600', 
      bgColor: 'bg-yellow-100', 
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-300',
      icon: '🥇',
      label: 'Gold', 
      value: 'gold' 
    },
  };
  
  // Get status style for question cards
  const getStatusStyles = (question: EnhancedQuestion) => {
    if (question.status === 'correct') {
      return 'bg-green-100 border-green-300 opacity-70';
    } else if (question.status === 'incorrect') {
      return 'bg-red-100 border-red-300 opacity-70';
    } else if (question.status === 'answered-by-others') {
      return 'bg-gray-100 border-gray-300 opacity-50';
    } else {
      const difficulty = question.difficulty as keyof typeof difficultyInfo;
      return `${difficultyInfo[difficulty].bgColor} ${difficultyInfo[difficulty].borderColor}`;
    }
  };
  
  // Get status icon for question cards
  const getStatusIcon = (question: EnhancedQuestion) => {
    if (question.status === 'correct') {
      return '✅';
    } else if (question.status === 'incorrect') {
      return '❌';
    } else if (question.status === 'answered-by-others') {
      return '👥';
    } else {
      const difficulty = question.difficulty as keyof typeof difficultyInfo;
      return difficultyInfo[difficulty].icon;
    }
  };
  
  // Get status text for accessibility
  const getStatusText = (question: EnhancedQuestion) => {
    if (question.status === 'correct') {
      return 'You answered this correctly!';
    } else if (question.status === 'incorrect') {
      return 'You answered this incorrectly';
    } else if (question.status === 'answered-by-others') {
      return 'Someone else answered this correctly';
    } else {
      return 'Available to answer';
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* User info & logout */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-lg font-medium">
            {participantName.charAt(0).toUpperCase()}
          </div>
          <div className="text-gray-800">
            <p className="font-medium">Hi, {participantName}!</p>
            <p className="text-xs text-gray-500">Choose a question to play</p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm flex items-center"
        >
          <span>Logout</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
      
      <h2 className="text-2xl font-bold text-center mb-6">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">Choose Your Question!</span>
      </h2>
      
      {/* Category filter */}
      <div className="mb-6">
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-500 text-white shadow-md'
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
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      
      {/* Questions by difficulty */}
      <div className="space-y-6">
        {Object.entries(difficultyInfo).map(([key, { label, value, textColor, icon }]) => (
          <div key={key} className="border rounded-lg p-4">
            <h3 className={`text-xl font-semibold mb-3 flex items-center ${textColor}`}>
              <span className="mr-2">{icon}</span>
              {label} Questions
            </h3>
            
            {questionsByDifficulty[value as keyof typeof questionsByDifficulty].length === 0 ? (
              <p className="text-gray-500 text-center py-4">No {label.toLowerCase()} questions available</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {questionsByDifficulty[value as keyof typeof questionsByDifficulty].map(question => (
                  <button
                    key={question._id}
                    onClick={() => !question.isDisabled && onSelectQuestion(question._id!)}
                    disabled={question.isDisabled}
                    className={`block w-full h-36 rounded-lg border-2 p-3 shadow-sm hover:shadow transition-all relative
                      ${getStatusStyles(question)}
                      ${question.isDisabled ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-102 transform'}`}
                    aria-label={`${question.text} - ${getStatusText(question)}`}
                  >
                    <div className="flex flex-col h-full justify-between">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-medium px-2 py-1 bg-white/20 rounded-full">
                          {question.category}
                        </span>
                        <span className="font-bold">{question.rupiah} Rp</span>
                      </div>
                      <div className="line-clamp-2 text-sm font-medium text-left">{question.text}</div>
                      <div className="absolute -right-2 -top-2 w-8 h-8 flex items-center justify-center rounded-full bg-white shadow text-xl">
                        {getStatusIcon(question)}
                      </div>
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