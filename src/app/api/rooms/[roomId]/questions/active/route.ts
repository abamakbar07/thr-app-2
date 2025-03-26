import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import { Room, Question, Participant, Answer } from '@/lib/db/models';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    // Await params to handle it properly
    const resolvedParams = await params;
    const { roomId } = resolvedParams;
    
    await dbConnect();
    
    // Get participant ID from query params
    const url = new URL(request.url);
    const participantId = url.searchParams.get('pid');
    
    if (!participantId) {
      return NextResponse.json(
        { error: 'Participant ID required' },
        { status: 400 }
      );
    }
    
    // Verify the participant exists and belongs to this room
    const participant = await Participant.findOne({
      _id: participantId,
      roomId
    });
    
    if (!participant) {
      return NextResponse.json(
        { error: 'Invalid participant for this room' },
        { status: 403 }
      );
    }
    
    // Fetch the questions for this room
    const questions = await Question.find({ 
      roomId
    }).sort({ difficulty: 1, createdAt: -1 });
    
    // Get all answers for this participant
    const participantAnswers = await Answer.find({
      participantId,
      roomId
    });
    
    // Get all correctly answered questions in this room by any participant
    const correctlyAnsweredQuestions = await Answer.find({
      roomId,
      isCorrect: true
    }).distinct('questionId');
    
    // Create a map of questionId to participant's answer result
    const answeredMap = new Map();
    participantAnswers.forEach(answer => {
      answeredMap.set(answer.questionId.toString(), {
        isCorrect: answer.isCorrect,
        selectedOption: answer.selectedOptionIndex
      });
    });
    
    // Process the questions to add their status
    const processedQuestions = questions.map(question => {
      const questionId = question._id.toString();
      const participantAnswer = answeredMap.get(questionId);
      const isAnsweredByParticipant = !!participantAnswer;
      const isAnsweredCorrectlyByAnyone = correctlyAnsweredQuestions.some(
        id => id.toString() === questionId
      );
      
      return {
        ...question.toObject(),
        // A question is disabled if:
        // 1. It's marked as disabled in the database
        // 2. It's been correctly answered by any participant
        // 3. The current participant has already attempted it
        isDisabled: 
          question.isDisabled || 
          isAnsweredCorrectlyByAnyone || 
          isAnsweredByParticipant,
        status: isAnsweredByParticipant 
          ? (participantAnswer.isCorrect ? 'correct' : 'incorrect') 
          : (isAnsweredCorrectlyByAnyone ? 'answered-by-others' : 'available'),
        participantAnswer: isAnsweredByParticipant ? participantAnswer : null
      };
    });
    
    return NextResponse.json({ 
      questions: processedQuestions,
      message: 'Active questions retrieved successfully' 
    });
  } catch (error) {
    console.error('Error fetching active questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active questions' },
      { status: 500 }
    );
  }
} 