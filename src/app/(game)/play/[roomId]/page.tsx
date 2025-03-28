'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { TriviaCard } from '../../../../components/game/TriviaCard';
import { IQuestion, IRoom } from '../../../../lib/db/models';
import { motion } from 'framer-motion';
import React from 'react';
import { QuestionSelection } from '../../../../components/game/QuestionSelection';
import { QuestionCardSkeleton, LeaderboardSkeleton } from '@/components/ui/Skeleton';
import { Leaderboard } from '@/components/game/Leaderboard';
import { formatCurrency } from '@/lib/utils';

interface AnswerResult {
  isCorrect: boolean;
  correctOptionIndex: number;
  rupiahAwarded: number;
  explanation: string;
  newTotalRupiah: number;
}

interface EnhancedQuestion extends IQuestion {
  status?: 'available' | 'answered-by-others' | 'correct' | 'incorrect';
  participantAnswer?: {
    isCorrect: boolean;
    selectedOption: number;
  } | null;
}

export default function GamePlay() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const participantId = searchParams.get('pid');
  const roomId = params.roomId as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<IRoom | null>(null);
  const [questions, setQuestions] = useState<EnhancedQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<EnhancedQuestion | null>(null);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [rupiah, setRupiah] = useState(0);
  const [participantName, setParticipantName] = useState('');
  
  // Fetch room and questions
  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        setIsLoading(true);
        
        // Validate participant belongs to this room
        const storedParticipant = localStorage.getItem('participant');
        if (!storedParticipant) {
          router.push('/join');
          return;
        }
        
        const parsedParticipant = JSON.parse(storedParticipant);
        
        // Check if room ID matches
        if (parsedParticipant.roomId !== roomId) {
          // Participant is trying to access wrong room
          router.push('/join');
          return;
        }
        
        // Get participant ID from either URL parameter or localStorage
        const pid = participantId || parsedParticipant.id || '';
        
        // Set participant name from local storage
        setParticipantName(parsedParticipant.name || 'Player');
        
        // Fetch room details
        const roomResponse = await fetch(`/api/rooms/${roomId}?pid=${pid}`);
        if (!roomResponse.ok) {
          throw new Error('Failed to load room data');
        }
        const roomData = await roomResponse.json();
        setRoom(roomData.room);
        
        // Fetch questions
        const questionsResponse = await fetch(`/api/rooms/${roomId}/questions/active?pid=${pid}`);
        if (!questionsResponse.ok) {
          throw new Error('Failed to load questions');
        }
        const questionsData = await questionsResponse.json();
        setQuestions(questionsData.questions);
        
        // Fetch participant points
        const participantResponse = await fetch(`/api/participants/${pid}`);
        if (participantResponse.ok) {
          const participantData = await participantResponse.json();
          setRupiah(participantData.totalRupiah || 0);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading game data:', error);
        setError('Failed to load the game. Please try again.');
        setIsLoading(false);
      }
    };
    
    fetchRoomData();
    
    // Set up polling for question updates
    const pollInterval = setInterval(() => {
      const storedParticipant = localStorage.getItem('participant');
      if (!storedParticipant) return;
      
      const parsedParticipant = JSON.parse(storedParticipant);
      const pid = participantId || parsedParticipant.id || '';
      
      fetch(`/api/rooms/${roomId}/questions/active?pid=${pid}`)
        .then(res => res.json())
        .then(data => {
          setQuestions(data.questions);
        })
        .catch(err => console.error('Error polling questions:', err));
      
      // Also update participant points
      fetch(`/api/participants/${pid}`)
        .then(res => res.json())
        .then(data => {
          setRupiah(data.totalRupiah || 0);
        })
        .catch(err => console.error('Error polling participant data:', err));
    }, 5000); // Poll every 5 seconds (increased frequency)
    
    return () => clearInterval(pollInterval);
  }, [roomId, participantId, router]);
  
  const handleSelectQuestion = async (questionId: string) => {
    try {
      // Find the selected question
      const question = questions.find(q => q._id === questionId);
      if (question) {
        setSelectedQuestion(question);
        setAnswerResult(null);
      }
    } catch (error) {
      console.error('Error selecting question:', error);
    }
  };
  
  const handleSubmitAnswer = async (selectedOptionIndex: number, timeToAnswer: number) => {
    if (!selectedQuestion || !participantId) return;
    
    try {
      const response = await fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: selectedQuestion._id,
          participantId,
          roomId,
          selectedOptionIndex,
          timeToAnswer,
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        setAnswerResult(result);
        
        // Update points
        setRupiah(result.newTotalRupiah);
        
        // Update the question in our list to show as disabled
        setQuestions(prev => 
          prev.map(q => 
            q._id === selectedQuestion._id 
              ? { 
                  ...q, 
                  isDisabled: true,
                  status: result.isCorrect ? 'correct' : 'incorrect',
                  participantAnswer: {
                    isCorrect: result.isCorrect,
                    selectedOption: selectedOptionIndex
                  }
                } 
              : q
          )
        );
        
        // After 5 seconds, go back to question selection
        setTimeout(() => {
          setSelectedQuestion(null);
          setAnswerResult(null);
          
          // Refresh the questions to get the latest status
          fetch(`/api/rooms/${roomId}/questions/active?pid=${participantId}`)
            .then(res => res.json())
            .then(data => {
              setQuestions(data.questions);
            })
            .catch(err => console.error('Error refreshing questions:', err));
        }, 5000);
      } else {
        console.error('Error submitting answer:', await response.json());
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };
  
  const handleLogout = async () => {
    // Store access code for future reference
    const storedParticipant = localStorage.getItem('participant');
    if (storedParticipant && participantId) {
      try {
        // Call the logout API to mark the participant as inactive
        const response = await fetch('/api/participants/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            participantId: participantId,
          }),
        });
        
        if (response.ok) {
          const result = await response.json();
          // Store relevant information for rejoining
          localStorage.setItem('lastAccessCode', result.accessCode);
          localStorage.setItem('lastRoomId', roomId);
          localStorage.setItem('lastParticipantName', JSON.parse(storedParticipant).name);
          console.log('Successfully logged out, you can rejoin with the same access code later');
        } else {
          console.error('Error logging out:', await response.json());
        }
      } catch (e) {
        console.error('Error in logout process:', e);
      }
    }
    
    // Clear current participant data
    localStorage.removeItem('participant');
    
    // Redirect to join page
    router.push('/join');
  };
  
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between mb-6">
          <div className="w-1/2 pr-4">
            <QuestionCardSkeleton className="mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <QuestionCardSkeleton key={i} />
              ))}
            </div>
          </div>
          <div className="w-1/2 pl-4">
            <LeaderboardSkeleton />
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/join')}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
          >
            Go Back to Join Page
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Room header with participant info */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{room?.name}</h1>
          <p className="text-gray-600">Playing as: {participantName}</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold">
            {formatCurrency(rupiah)}
          </div>
          <button 
            onClick={handleLogout}
            className="bg-red-100 text-red-800 px-4 py-2 rounded-full font-semibold"
          >
            Exit
          </button>
        </div>
      </div>
      
      {selectedQuestion ? (
        <div className="mb-6">
          <button 
            onClick={() => setSelectedQuestion(null)} 
            className="mb-4 inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to questions
          </button>
          <TriviaCard 
            question={selectedQuestion}
            onAnswer={handleSubmitAnswer}
            timeLimit={room?.settings.timePerQuestion || 15}
            participantName={participantName}
          />
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-2/3">
            <QuestionSelection 
              questions={questions} 
              onSelectQuestion={handleSelectQuestion} 
              participantName={participantName}
              onLogout={handleLogout}
              isLoading={isLoading}
            />
          </div>
          <div className="w-full lg:w-1/3">
            <Leaderboard 
              roomId={roomId} 
              currentParticipantId={participantId || ''}
              refreshInterval={5000}
            />
          </div>
        </div>
      )}
      
      {/* Show answer result modal if applicable */}
      {answerResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 text-center">
            {answerResult.isCorrect ? (
              <>
                <div className="bg-green-100 w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4">
                  <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Correct!</h3>
              </>
            ) : (
              <>
                <div className="bg-red-100 w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4">
                  <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Incorrect</h3>
              </>
            )}
            
            <p className="text-gray-600 mb-4">
              {answerResult.isCorrect 
                ? `You earned ${answerResult.rupiahAwarded} Rp!` 
                : 'Better luck next time!'}
            </p>
            
            {answerResult.explanation && (
              <div className="bg-blue-50 p-4 rounded-lg mb-4 text-left">
                <h4 className="font-semibold mb-1">Explanation:</h4>
                <p className="text-sm">{answerResult.explanation}</p>
              </div>
            )}
            
            <button
              onClick={() => setAnswerResult(null)}
              className="mt-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 