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

interface EnhancedRoom extends IRoom {
  showLeaderboard?: boolean;
}

export default function GamePlay() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const participantId = searchParams.get('pid');
  const roomId = params.roomId as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<EnhancedRoom | null>(null);
  const [questions, setQuestions] = useState<EnhancedQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<EnhancedQuestion | null>(null);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [rupiah, setRupiah] = useState(0);
  const [participantName, setParticipantName] = useState('');
  const [gameCompleted, setGameCompleted] = useState(false);
  
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
        
        // Check if all questions are answered/disabled
        const allQuestionsAnswered = questionsData.questions.every(
          (q: EnhancedQuestion) => q.isDisabled || q.status === 'answered-by-others'
        );
        setGameCompleted(allQuestionsAnswered);
        
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
        
        // Check if all questions are now answered
        const updatedQuestions = questions.map(q => 
          q._id === selectedQuestion._id 
            ? { ...q, isDisabled: true } 
            : q
        );
        const allAnswered = updatedQuestions.every(q => q.isDisabled || q.status === 'answered-by-others');
        setGameCompleted(allAnswered);
        
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
        <div className="text-center">
          <button
            onClick={() => router.push('/join')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#128C7E] hover:bg-[#075E54] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#128C7E]"
          >
            Return to Join Page
          </button>
        </div>
      </div>
    );
  }
  
  // Game completed state - all questions answered
  if (gameCompleted && !selectedQuestion) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{room?.name || 'Islamic Trivia'}</h1>
            <p className="text-sm text-gray-500">Welcome, {participantName}</p>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700">Your THR (Tunjangan Hari Raya):</div>
            <div className="text-2xl font-bold text-[#128C7E]">{formatCurrency(rupiah)}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-6 text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-[#25D366] rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Game Completed!</h2>
          <p className="text-gray-600 mb-8">You've answered all available questions in this game room.</p>
          <p className="text-xl font-semibold mb-2">Total THR Earned: {formatCurrency(rupiah)}</p>
          
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <a
              href={`/certificate/${participantId}`}
              target="_blank"
              rel="noopener noreferrer" 
              className="inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-[#128C7E] hover:bg-[#075E54] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#128C7E]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
              View Certificate
            </a>
            <button
              onClick={handleLogout}
              className="inline-flex justify-center items-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#128C7E]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Exit Game
            </button>
          </div>
        </div>
        
        {room?.showLeaderboard && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Leaderboard</h2>
            <Leaderboard roomId={roomId} currentParticipantId={participantId as string} />
          </div>
        )}
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