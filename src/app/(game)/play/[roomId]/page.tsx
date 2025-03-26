'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { QuestionSelection } from '@/components/game/QuestionSelection';
import { TriviaCard } from '@/components/game/TriviaCard';
import { IQuestion, IRoom } from '@/lib/db/models';
import { motion } from 'framer-motion';
import Image from 'next/image';

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
    if (!participantId) {
      router.push('/join');
      return;
    }
    
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
        if (parsedParticipant.roomId !== roomId || parsedParticipant._id !== participantId) {
          // Participant doesn't match or is trying to access wrong room
          router.push('/join');
          return;
        }
        
        // Set participant name from local storage
        setParticipantName(parsedParticipant.name || 'Player');
        
        // Fetch room details
        const roomResponse = await fetch(`/api/rooms/${roomId}?pid=${participantId}`);
        if (!roomResponse.ok) {
          throw new Error('Failed to load room data');
        }
        const roomData = await roomResponse.json();
        setRoom(roomData.room);
        
        // Fetch questions
        const questionsResponse = await fetch(`/api/rooms/${roomId}/questions/active?pid=${participantId}`);
        if (!questionsResponse.ok) {
          throw new Error('Failed to load questions');
        }
        const questionsData = await questionsResponse.json();
        setQuestions(questionsData.questions);
        
        // Fetch participant points
        const participantResponse = await fetch(`/api/participants/${participantId}`);
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
      fetch(`/api/rooms/${roomId}/questions/active?pid=${participantId}`)
        .then(res => res.json())
        .then(data => {
          setQuestions(data.questions);
        })
        .catch(err => console.error('Error polling questions:', err));
      
      // Also update participant points
      fetch(`/api/participants/${participantId}`)
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
  
  const handleLogout = () => {
    // Clear participant data from local storage
    localStorage.removeItem('participant');
    // Redirect to join page
    router.push('/join');
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="text-center p-6 bg-white rounded-xl shadow-lg">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <p className="text-xl font-medium text-gray-700">Loading your game...</p>
          <p className="text-gray-500 mt-2">Getting everything ready!</p>
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
    <div className="min-h-screen bg-blue-50">
      {/* Header with room info and points */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-wrap justify-between items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center">
              <span className="mr-2">🎮</span> 
              {room?.name}
            </h1>
            <p className="text-sm text-gray-500">
              Code: <span className="font-mono font-medium">{room?.accessCode}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-green-100 px-4 py-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-bold text-lg text-green-800">{rupiah}</span>
            </div>
          </div>
        </div>
      </header>
      
      <main className="py-6">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {selectedQuestion ? (
            <div className="px-4">
              {answerResult ? (
                // Answer result screen
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-xl shadow-lg p-6 max-w-lg mx-auto border-2"
                >
                  <div className="flex items-center justify-center mb-6">
                    {answerResult.isCorrect ? (
                      <div className="bg-green-100 rounded-full p-5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <div className="bg-red-100 rounded-full p-5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <h2 className="text-2xl font-bold text-center mb-3">
                    {answerResult.isCorrect ? '✨ Correct! ✨' : '❌ Incorrect ❌'}
                  </h2>
                  
                  {answerResult.isCorrect ? (
                    <p className="text-green-600 text-center font-medium text-xl mb-4">
                      You earned {answerResult.rupiahAwarded} rupiah!
                    </p>
                  ) : (
                    <p className="text-center mb-4 text-lg">
                      The correct answer was <span className="font-bold">Option {String.fromCharCode(65 + answerResult.correctOptionIndex)}</span>
                    </p>
                  )}
                  
                  <div className="bg-gray-50 p-5 rounded-lg mb-5 border">
                    <h3 className="font-semibold mb-2 text-gray-800">Explanation:</h3>
                    <p className="text-gray-700">{answerResult.explanation}</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-blue-600 mb-2 font-medium">
                      Going back to question selection...
                    </p>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full animate-progress"></div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                // Question answering screen
                <TriviaCard
                  question={selectedQuestion}
                  onAnswer={handleSubmitAnswer}
                  timeLimit={room?.settings.timePerQuestion || 15}
                  participantName={participantName}
                />
              )}
            </div>
          ) : (
            // Question selection screen
            <QuestionSelection
              questions={questions}
              onSelectQuestion={handleSelectQuestion}
              participantName={participantName}
              onLogout={handleLogout}
            />
          )}
        </div>
      </main>
    </div>
  );
} 