'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { QuestionSelection } from '@/components/game/QuestionSelection';
import { TriviaCard } from '@/components/game/TriviaCard';
import { IQuestion, IRoom } from '@/lib/db/models';

interface AnswerResult {
  isCorrect: boolean;
  correctOptionIndex: number;
  rupiahAwarded: number;
  explanation: string;
  newTotalRupiah: number;
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
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<IQuestion | null>(null);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [rupiah, setRupiah] = useState(0);
  
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
        if (parsedParticipant.roomId !== roomId || parsedParticipant.id !== participantId) {
          // Participant doesn't match or is trying to access wrong room
          router.push('/join');
          return;
        }
        
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
    }, 10000); // Poll every 10 seconds
    
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
        
        // Update the question in our list to show as disabled if correct
        if (result.isCorrect) {
          setQuestions(prev => 
            prev.map(q => 
              q._id === selectedQuestion._id ? { ...q, isDisabled: true } : q
            )
          );
        }
        
        // After 5 seconds, go back to question selection
        setTimeout(() => {
          setSelectedQuestion(null);
          setAnswerResult(null);
        }, 5000);
      } else {
        console.error('Error submitting answer:', await response.json());
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-700">Loading game...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/join')}
            className="w-full bg-emerald-600 text-white py-2 rounded-md hover:bg-emerald-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with room info and points */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{room?.name}</h1>
            <p className="text-sm text-gray-500">Access Code: <span className="font-mono">{room?.accessCode}</span></p>
          </div>
          <div className="bg-emerald-100 px-4 py-2 rounded-full flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-bold text-emerald-800">{rupiah} rupiah</span>
          </div>
        </div>
      </header>
      
      <main className="py-6">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {selectedQuestion ? (
            <div className="px-4">
              {answerResult ? (
                // Answer result screen
                <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg mx-auto">
                  <div className="flex items-center justify-center mb-4">
                    {answerResult.isCorrect ? (
                      <div className="bg-green-100 rounded-full p-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <div className="bg-red-100 rounded-full p-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <h2 className="text-xl font-bold text-center mb-2">
                    {answerResult.isCorrect ? 'Correct!' : 'Incorrect!'}
                  </h2>
                  
                  {answerResult.isCorrect ? (
                    <p className="text-green-600 text-center font-medium mb-4">
                      You earned {answerResult.rupiahAwarded} rupiah!
                    </p>
                  ) : (
                    <p className="text-center mb-2">
                      The correct answer was option {String.fromCharCode(65 + answerResult.correctOptionIndex)}
                    </p>
                  )}
                  
                  <div className="bg-gray-50 p-4 rounded-md mb-4">
                    <h3 className="font-medium mb-2">Explanation:</h3>
                    <p className="text-gray-700">{answerResult.explanation}</p>
                  </div>
                  
                  <p className="text-center text-sm text-gray-500">
                    Returning to question selection in a few seconds...
                  </p>
                </div>
              ) : (
                // Question answering screen
                <TriviaCard
                  question={selectedQuestion}
                  onAnswer={handleSubmitAnswer}
                  timeLimit={room?.settings.timePerQuestion || 15}
                />
              )}
            </div>
          ) : (
            // Question selection screen
            <QuestionSelection
              questions={questions}
              onSelectQuestion={handleSelectQuestion}
            />
          )}
        </div>
      </main>
    </div>
  );
} 