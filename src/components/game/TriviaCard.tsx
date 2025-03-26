'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { IQuestion } from '@/lib/db/models';
import { motion } from 'framer-motion';

interface TriviaCardProps {
  question: IQuestion;
  onAnswer: (selectedIndex: number, timeToAnswer: number) => void;
  timeLimit: number;
  participantName: string;
}

export function TriviaCard({ question, onAnswer, timeLimit, participantName }: TriviaCardProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(timeLimit);
  const [isAnswered, setIsAnswered] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  
  // Difficulty color mapping
  const difficultyConfig = {
    bronze: {
      color: 'bg-amber-500',
      text: 'text-amber-800',
      border: 'border-amber-300',
      icon: '🥉',
      label: 'Bronze'
    },
    silver: {
      color: 'bg-gray-400',
      text: 'text-gray-700',
      border: 'border-gray-300',
      icon: '🥈',
      label: 'Silver'
    },
    gold: {
      color: 'bg-yellow-400',
      text: 'text-yellow-800',
      border: 'border-yellow-400',
      icon: '🥇',
      label: 'Gold'
    }
  };
  
  // Get config for current difficulty
  const currentDifficulty = difficultyConfig[question.difficulty as keyof typeof difficultyConfig];
  
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
  
  // Time percentage for progress bar
  const timePercentage = (timeRemaining / timeLimit) * 100;
  
  // Animations and sounds for kids
  const optionVariants = {
    hover: { scale: 1.03, transition: { duration: 0.2 } },
    tap: { scale: 0.97, transition: { duration: 0.1 } },
  };
  
  return (
    <div className="max-w-2xl mx-auto">
      {/* User info banner */}
      <div className="mb-4 bg-blue-100 rounded-lg p-3 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold mr-2">
            {participantName.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-blue-800">{participantName}</span>
        </div>
        <div className="flex items-center">
          <span className="text-sm font-medium text-blue-800 mr-1">Rupiah:</span>
          <span className="px-2 py-1 bg-white rounded-full text-sm font-bold text-blue-800">{question.rupiah}</span>
        </div>
      </div>
    
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl shadow-xl overflow-hidden border-2 border-gray-200"
      >
        {/* Card header with difficulty & timer */}
        <div className="relative">
          <div className="flex justify-between items-center p-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{currentDifficulty.icon}</span>
              <div className={`px-3 py-1 ${currentDifficulty.color} text-white text-sm font-bold rounded-full`}>
                {currentDifficulty.label}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className={`font-mono font-bold text-lg ${timeRemaining < 5 ? 'text-red-600 animate-pulse' : 'text-gray-700'}`}>
                {timeRemaining}
              </span>
            </div>
          </div>
          
          {/* Time progress bar */}
          <div className="h-2 w-full bg-gray-200">
            <div
              className={`h-full transition-all duration-1000 ${
                timeRemaining < 5 ? 'bg-red-500' : timeRemaining < 10 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${timePercentage}%` }}
            ></div>
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
                className="rounded-lg object-cover border-2 border-gray-200 shadow-sm"
              />
            </div>
          )}
          
          <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">{question.text}</h3>
          
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <motion.button
                key={index}
                onClick={() => handleSelectOption(index)}
                disabled={isAnswered}
                variants={optionVariants}
                whileHover="hover"
                whileTap="tap"
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedOption === index
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                } ${isAnswered ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="flex items-center">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full ${
                    selectedOption === index 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-700'
                  } mr-3 font-bold`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="text-lg">{option}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
        
        {/* Points indicator */}
        <div className="bg-gray-50 px-5 py-3 flex justify-between items-center border-t">
          <span className="text-sm font-medium text-gray-500">Category: {question.category}</span>
          <div className="flex items-center">
            <span className="text-sm font-medium mr-1">Reward:</span>
            <span className="font-bold text-green-700">{question.rupiah} Rupiah</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}