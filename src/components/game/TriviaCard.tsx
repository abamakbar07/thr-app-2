'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { IQuestion } from '@/lib/db/models';

interface TriviaCardProps {
  question: IQuestion;
  onAnswer: (selectedIndex: number, timeToAnswer: number) => void;
  timeLimit: number;
}

export function TriviaCard({ question, onAnswer, timeLimit }: TriviaCardProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(timeLimit);
  const [isAnswered, setIsAnswered] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  
  // Difficulty color mapping
  const difficultyColors = {
    bronze: 'bg-amber-600',
    silver: 'bg-gray-400',
    gold: 'bg-yellow-500',
  };
  
  useEffect(() => {
    if (isAnswered) return;
    
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Time's up - submit with no selection
          const timeElapsed = Date.now() - startTimeRef.current;
          setIsAnswered(true);
          onAnswer(-1, timeElapsed / 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isAnswered, onAnswer]);
  
  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    
    setSelectedOption(index);
    setIsAnswered(true);
    
    // Calculate time taken to answer
    const timeElapsed = Date.now() - startTimeRef.current;
    onAnswer(index, timeElapsed / 1000);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-lg mx-auto">
      {/* Card header with difficulty & timer */}
      <div className="flex justify-between items-center p-4 border-b">
        <div className={`px-3 py-1 text-white text-sm font-medium rounded-full ${difficultyColors[question.difficulty]}`}>
          {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
        </div>
        <div className="flex items-center space-x-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className={`font-mono ${timeRemaining < 5 ? 'text-red-600 font-bold' : 'text-gray-700'}`}>
            {timeRemaining}s
          </span>
        </div>
      </div>
      
      {/* Question content */}
      <div className="p-5">
        {question.imageUrl && (
          <div className="mb-4 flex justify-center">
            <Image
              src={question.imageUrl}
              alt="Question image"
              width={300}
              height={200}
              className="rounded-md object-cover"
            />
          </div>
        )}
        
        <h3 className="text-lg font-medium text-gray-900 mb-4">{question.text}</h3>
        
        <div className="space-y-2">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleSelectOption(index)}
              disabled={isAnswered}
              className={`w-full text-left p-3 rounded-md border transition-all ${
                selectedOption === index
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:bg-gray-50'
              } ${isAnswered ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <div className="flex items-center">
                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-gray-700 mr-3">
                  {String.fromCharCode(65 + index)}
                </span>
                <span>{option}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Points indicator */}
      <div className="bg-gray-50 px-5 py-3 text-right">
        <span className="text-sm font-medium text-gray-700">
          {question.points} points
        </span>
      </div>
    </div>
  );
}