import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import { Question, Participant, Answer } from '@/lib/db/models';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const { questionId, participantId, roomId, selectedOptionIndex, timeToAnswer } = await req.json();
    
    if (!questionId || !participantId || !roomId || selectedOptionIndex === undefined || !timeToAnswer) {
      return new NextResponse(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }
    
    // Get the question to check the answer
    const question = await Question.findById(questionId);
    if (!question) {
      return new NextResponse(JSON.stringify({ error: 'Question not found' }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      });
    }
    
    // Check if the participant exists
    const participant = await Participant.findById(participantId);
    if (!participant) {
      return new NextResponse(JSON.stringify({ error: 'Participant not found' }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      });
    }
    
    // Check if this question was already answered correctly by this participant
    const existingCorrectAnswer = await Answer.findOne({
      questionId,
      participantId,
      isCorrect: true,
    });
    
    if (existingCorrectAnswer) {
      return new NextResponse(JSON.stringify({ error: 'Question already answered correctly' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }
    
    // Determine if answer is correct
    const isCorrect = selectedOptionIndex === question.correctOptionIndex;
    
    // Calculate rupiah based on difficulty, time taken, and correctness
    let rupiahAwarded = 0;
    
    if (isCorrect) {
      // Base rupiah from question
      rupiahAwarded = question.rupiah || 0;
      
      // Bonus for fast answers (up to 50% extra for answering in 3 seconds or less)
      const timeFactor = Math.max(0, 1 - (timeToAnswer / 15));
      const timeBonus = Math.floor(rupiahAwarded * 0.5 * timeFactor);
      rupiahAwarded += timeBonus;
      
      // If correct, mark the question as disabled for all participants
      await Question.findByIdAndUpdate(questionId, { isDisabled: true });
      
      // Update participant's total rupiah
      await Participant.findByIdAndUpdate(participantId, {
        $inc: { totalRupiah: rupiahAwarded },
      });
    }
    
    // Record the answer
    const answer = await Answer.create({
      questionId,
      participantId,
      roomId,
      selectedOptionIndex,
      isCorrect,
      timeToAnswer,
      rupiahAwarded,
      answeredAt: new Date(),
    });
    
    // Get updated total rupiah
    const updatedParticipant = await Participant.findById(participantId);
    
    return new NextResponse(JSON.stringify({
      isCorrect,
      correctOptionIndex: question.correctOptionIndex,
      rupiahAwarded,
      explanation: question.explanation,
      newTotalRupiah: updatedParticipant?.totalRupiah || 0,
    }), {
      status: 201,
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing answer:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to process answer' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
} 