import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import { Question, Participant, Answer } from '@/lib/db/models';
import mongoose from 'mongoose';
import { z } from 'zod';

// Schema validation for answer submission
const answerSchema = z.object({
  questionId: z.string().min(1),
  participantId: z.string().min(1),
  roomId: z.string().min(1),
  selectedOptionIndex: z.number().int().min(0),
  timeToAnswer: z.number().positive()
});

export async function POST(req: NextRequest) {
  // Start MongoDB session for transaction
  const session = await mongoose.startSession();
  
  try {
    await dbConnect();
    
    // Parse and validate request body
    const body = await req.json();
    const validation = answerSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.format() },
        { status: 400 }
      );
    }
    
    const { questionId, participantId, roomId, selectedOptionIndex, timeToAnswer } = validation.data;
    
    // Convert string IDs to ObjectIds
    const questionObjectId = new mongoose.Types.ObjectId(questionId);
    const participantObjectId = new mongoose.Types.ObjectId(participantId);
    const roomObjectId = new mongoose.Types.ObjectId(roomId);
    
    // Begin transaction
    session.startTransaction();
    
    // Get the question to check the answer
    const question = await Question.findById(questionObjectId).session(session);
    if (!question) {
      await session.abortTransaction();
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    
    // Check if the participant exists
    const participant = await Participant.findById(participantObjectId).session(session);
    if (!participant) {
      await session.abortTransaction();
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }
    
    // Verify that the question belongs to the specified room
    if (question.roomId.toString() !== roomId) {
      await session.abortTransaction();
      return NextResponse.json({ error: 'Question does not belong to the specified room' }, { status: 400 });
    }
    
    // Check if the question is already disabled (answered correctly by someone else)
    if (question.isDisabled) {
      await session.abortTransaction();
      return NextResponse.json({ error: 'This question has already been answered correctly by another participant' }, { status: 400 });
    }
    
    // Check if this question was already answered by this participant
    const existingAnswer = await Answer.findOne({
      questionId: questionObjectId,
      participantId: participantObjectId,
    }).session(session);
    
    if (existingAnswer) {
      await session.abortTransaction();
      return NextResponse.json({ error: 'You have already answered this question' }, { status: 400 });
    }
    
    // Check if anyone has already answered this question correctly
    const correctAnswer = await Answer.findOne({
      questionId: questionObjectId,
      isCorrect: true
    }).session(session);
    
    if (correctAnswer) {
      await session.abortTransaction();
      return NextResponse.json({ error: 'This question has already been answered correctly by another participant' }, { status: 400 });
    }
    
    // Verify the selected option is valid
    if (selectedOptionIndex < 0 || selectedOptionIndex >= question.options.length) {
      await session.abortTransaction();
      return NextResponse.json({ error: 'Invalid option selected' }, { status: 400 });
    }
    
    // Determine if answer is correct
    const isCorrect = selectedOptionIndex === question.correctOptionIndex;
    
    // Calculate rupiah based on difficulty, time taken, and correctness
    let rupiahAwarded = 0;
    
    if (isCorrect) {
      // Base rupiah from question
      rupiahAwarded = question.rupiah || 0;
      
      // Bonus for fast answers (up to 50% extra for answering in 3 seconds or less)
      // const timeFactor = Math.max(0, 1 - (timeToAnswer / 15));
      // const timeBonus = Math.floor(rupiahAwarded * 0.5 * timeFactor);
      // rupiahAwarded += timeBonus;
      
      // Mark the question as disabled if answered correctly
      await Question.findByIdAndUpdate(
        questionObjectId,
        { isDisabled: true },
        { session }
      );
      
      // Update participant's total rupiah
      await Participant.findByIdAndUpdate(
        participantObjectId, 
        { $inc: { totalRupiah: rupiahAwarded } },
        { session }
      );
    }
    
    // Record the answer
    const answer = await Answer.create([{
      questionId: questionObjectId,
      participantId: participantObjectId,
      roomId: roomObjectId,
      selectedOptionIndex,
      isCorrect,
      timeToAnswer,
      rupiahAwarded,
      answeredAt: new Date(),
    }], { session });
    
    // Get updated total rupiah
    const updatedParticipant = await Participant.findById(participantObjectId).session(session);
    
    // Commit the transaction
    await session.commitTransaction();
    
    return NextResponse.json({
      isCorrect,
      correctOptionIndex: question.correctOptionIndex,
      rupiahAwarded,
      explanation: question.explanation,
      newTotalRupiah: updatedParticipant?.totalRupiah || 0,
    }, { status: 201 });
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    
    console.error('Error processing answer:', error);
    
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json({ error: 'Validation error', details: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to process answer' }, { status: 500 });
  } finally {
    // End session
    session.endSession();
  }
} 