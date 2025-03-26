import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import { Participant, Answer, Redemption } from '@/lib/db/models';
import { getSession } from '@/lib/auth/session';

export async function GET(
  request: NextRequest,
  { params }: { params: { participantId: string } }
) {
  try {
    // Extract participantId to handle it properly
    const { participantId } = params;
    
    await dbConnect();
    
    // Find participant
    const participant = await Participant.findById(participantId).populate('roomId', 'name accessCode');
    
    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }
    
    // Get participant's answers
    const answers = await Answer.find({ participantId });
    const totalAnswers = answers.length;
    const correctAnswers = answers.filter(answer => answer.isCorrect).length;
    
    // Get redemptions
    const redemptions = await Redemption.find({ 
      participantId,
      status: { $in: ['pending', 'fulfilled'] }
    });
    
    const totalClaimed = redemptions.reduce((sum, r) => sum + r.rupiahSpent, 0);
    const remainingAmount = participant.totalRupiah - totalClaimed;
    
    // Return participant data with detailed information
    return NextResponse.json({
      id: participant._id,
      name: participant.name,
      roomId: participant.roomId,
      joinedAt: participant.joinedAt,
      totalRupiah: participant.totalRupiah,
      accessCode: participant.accessCode,
      currentStatus: participant.currentStatus,
      thrClaimStatus: participant.thrClaimStatus,
      stats: {
        totalAnswers,
        correctAnswers,
        accuracy: totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0,
        claimedAmount: totalClaimed,
        remainingAmount
      }
    });
    
  } catch (error) {
    console.error('Error fetching participant:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participant' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { participantId: string } }
) {
  try {
    // Verify admin session
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Extract participantId to handle it properly
    const { participantId } = params;
    
    await dbConnect();
    
    // Get update data from request
    const data = await request.json();
    const allowedFields = ['name', 'currentStatus', 'thrClaimStatus', 'totalRupiah'];
    
    // Filter out fields that are not allowed to be updated
    const updateData: Record<string, any> = {};
    Object.keys(data).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = data[key];
      }
    });
    
    // Make sure thrClaimStatus is valid if included
    if (updateData.thrClaimStatus && !['unclaimed', 'processing', 'claimed'].includes(updateData.thrClaimStatus)) {
      return NextResponse.json(
        { error: 'Invalid THR claim status' },
        { status: 400 }
      );
    }
    
    // Update participant
    const updatedParticipant = await Participant.findByIdAndUpdate(
      participantId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedParticipant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      id: updatedParticipant._id,
      name: updatedParticipant.name,
      currentStatus: updatedParticipant.currentStatus,
      thrClaimStatus: updatedParticipant.thrClaimStatus,
      totalRupiah: updatedParticipant.totalRupiah
    });
    
  } catch (error) {
    console.error('Error updating participant:', error);
    return NextResponse.json(
      { error: 'Failed to update participant' },
      { status: 500 }
    );
  }
}