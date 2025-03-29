'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

type TutorialStep = {
  title: string;
  content: string;
  target: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
};

const tutorialSteps: TutorialStep[] = [
  {
    title: 'Welcome to Islamic Trivia Admin!',
    content: 'This quick tutorial will help you get started with creating and managing trivia games.',
    target: 'body',
    placement: 'top',
  },
  {
    title: 'Create Rooms',
    content: 'Start by creating a game room. Go to the Rooms section to create a new room with your desired settings.',
    target: '[data-tutorial="rooms"]',
    placement: 'right',
  },
  {
    title: 'Add Questions',
    content: 'Next, add trivia questions. Go to the Questions section to create new questions with different difficulty levels.',
    target: '[data-tutorial="questions"]',
    placement: 'right',
  },
  {
    title: 'Generate Access Codes',
    content: 'Generate access codes for participants. Each participant will need a unique code to join your game.',
    target: '[data-tutorial="access-codes"]',
    placement: 'right',
  },
  {
    title: 'Track Participants',
    content: 'View and manage participants who join your game rooms.',
    target: '[data-tutorial="participants"]',
    placement: 'right',
  },
  {
    title: 'Manage Rewards',
    content: 'Set up THR rewards that participants can claim with their earned points.',
    target: '[data-tutorial="rewards"]',
    placement: 'right',
  },
  {
    title: 'Monitor Sessions',
    content: 'Track active game sessions and view participant performance.',
    target: '[data-tutorial="sessions"]',
    placement: 'right',
  },
  {
    title: 'All Set!',
    content: 'You\'re ready to create amazing Islamic trivia games! You can revisit this tutorial anytime from the dashboard.',
    target: 'body',
    placement: 'top',
  },
];

export default function AdminTutorial() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<DOMRect | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if this is the first time the user is visiting the dashboard
    const hasSeenTutorial = localStorage.getItem('hasSeenAdminTutorial');
    
    if (!hasSeenTutorial && pathname === '/dashboard') {
      setShowTutorial(true);
      localStorage.setItem('hasSeenAdminTutorial', 'true');
    }
  }, [pathname]);

  useEffect(() => {
    if (showTutorial) {
      const step = tutorialSteps[currentStep];
      const element = document.querySelector(step.target);
      
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetElement(rect);
      } else {
        // If no element found, use body as fallback
        const bodyRect = document.body.getBoundingClientRect();
        setTargetElement(bodyRect);
      }
    }
  }, [currentStep, showTutorial]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // End of tutorial
      setShowTutorial(false);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setShowTutorial(false);
  };

  const handleRestartTutorial = () => {
    setCurrentStep(0);
    setShowTutorial(true);
  };

  if (!showTutorial) return (
    <div className="fixed bottom-4 right-4 z-50">
      <button 
        onClick={handleRestartTutorial}
        className="bg-green-600 text-white rounded-full p-2 shadow-lg hover:bg-green-700 transition-colors"
        aria-label="Show tutorial"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    </div>
  );

  // Calculate tooltip position based on placement
  const getTooltipPosition = () => {
    if (!targetElement) return { top: '50%', left: '50%' };
    
    const step = tutorialSteps[currentStep];
    
    switch (step.placement) {
      case 'top':
        return {
          top: `${targetElement.top - 120}px`,
          left: `${targetElement.left + targetElement.width / 2}px`,
          transform: 'translateX(-50%)'
        };
      case 'bottom':
        return {
          top: `${targetElement.bottom + 20}px`,
          left: `${targetElement.left + targetElement.width / 2}px`,
          transform: 'translateX(-50%)'
        };
      case 'left':
        return {
          top: `${targetElement.top + targetElement.height / 2}px`,
          left: `${targetElement.left - 320}px`,
          transform: 'translateY(-50%)'
        };
      case 'right':
        return {
          top: `${targetElement.top + targetElement.height / 2}px`,
          left: `${targetElement.right + 20}px`,
          transform: 'translateY(-50%)'
        };
      default:
        return {
          top: `${targetElement.top - 120}px`,
          left: `${targetElement.left + targetElement.width / 2}px`,
          transform: 'translateX(-50%)'
        };
    }
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={handleSkip}
          />
        )}
      </AnimatePresence>
      
      {/* Tutorial Tooltip */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed z-50 w-80 bg-white rounded-lg shadow-xl p-4"
            style={getTooltipPosition()}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-green-700">
                {tutorialSteps[currentStep].title}
              </h3>
              <button 
                onClick={handleSkip}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close tutorial"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">
              {tutorialSteps[currentStep].content}
            </p>
            
            <div className="flex justify-between items-center">
              <div>
                <button
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className={`text-sm ${currentStep === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-green-600 hover:text-green-700'}`}
                >
                  Previous
                </button>
              </div>
              
              <div className="flex space-x-1">
                {tutorialSteps.map((_, index) => (
                  <div 
                    key={index}
                    className={`w-2 h-2 rounded-full ${index === currentStep ? 'bg-green-600' : 'bg-gray-300'}`}
                  />
                ))}
              </div>
              
              <div>
                <button
                  onClick={handleNext}
                  className="text-sm font-medium bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  {currentStep === tutorialSteps.length - 1 ? 'Finish' : 'Next'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 