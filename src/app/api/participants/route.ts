import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import { Room, Participant, AccessCode } from '@/lib/db/models';
import mongoose from 'mongoose';
import { z } from 'zod';

// Schema validation for participant joining
const participantJoinSchema = z.object({
  roomId: z.string().min(1, "Room ID is required"),
  name: z.string().min(1, "Name is required"),
  accessCode: z.string().min(1, "Access code is required"),
  accessCodeId: z.string().optional(),
  participantId: z.string().optional() // Added to support rejoining participants
});

export async function POST(request: NextRequest) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await dbConnect();
    const body = await request.json();
    
    // Validate request body
    const validation = participantJoinSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        message: 'Invalid request data', 
        errors: validation.error.format() 
      }, { status: 400 });
    }

    const { roomId, name, accessCode, accessCodeId, participantId } = validation.data;

    // Check if room exists and is active
    const room = await Room.findOne({
      _id: roomId,
      isActive: true,
    }).session(session);

    if (!room) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json({ message: 'Room not found or inactive' }, { status: 404 });
    }

    // If we have a participantId, this is a rejoining participant
    if (participantId) {
      const existingParticipant = await Participant.findById(participantId).session(session);
      
      if (existingParticipant) {
        // Update participant's name and status if needed
        existingParticipant.name = name;
        existingParticipant.currentStatus = 'active';
        await existingParticipant.save({ session });
        
        await session.commitTransaction();
        session.endSession();
        
        return NextResponse.json({
          message: 'Participant rejoined successfully',
          participant: existingParticipant,
          isRejoin: true
        });
      }
      // If participant ID is provided but not found, continue with normal flow
    }

    // Check if the access code is already used by another participant
    const existingParticipant = await Participant.findOne({
      accessCode: accessCode,
      currentStatus: 'active'
    }).session(session);

    if (existingParticipant) {
      // If same participant is trying to rejoin the same room, update their name
      if (existingParticipant.roomId.toString() === roomId) {
        existingParticipant.name = name;
        await existingParticipant.save({ session });
        
        await session.commitTransaction();
        session.endSession();
        
        return NextResponse.json({
          message: 'Participant updated successfully',
          participant: existingParticipant
        });
      } else {
        // Access code is already used in a different room
        await session.abortTransaction();
        session.endSession();
        
        return NextResponse.json({
          message: 'Access code is already in use by another participant in a different room',
        }, { status: 400 });
      }
    }

    // Check if the access code is valid and not used yet (or belongs to an inactive participant)
    const accessCodeDoc = await AccessCode.findOne({ 
      code: accessCode,
      roomId: roomId,
      isActive: true
    }).session(session);

    if (!accessCodeDoc) {
      await session.abortTransaction();
      session.endSession();
      
      return NextResponse.json({ message: 'Invalid or inactive access code' }, { status: 400 });
    }

    // Check for inactive participant with this access code to reactivate
    const inactiveParticipant = await Participant.findOne({
      accessCode: accessCode,
      currentStatus: 'inactive'
    }).session(session);

    let participant;

    if (inactiveParticipant) {
      // Reactivate the participant
      inactiveParticipant.name = name;
      inactiveParticipant.currentStatus = 'active';
      participant = await inactiveParticipant.save({ session });
    } else {
      // Create a new participant
      participant = await Participant.create([{
        roomId: roomId,
        name: name,
        accessCode: accessCode,
        joinedAt: new Date(),
        totalRupiah: 0,
        currentStatus: 'active'
      }], { session });
      
      participant = participant[0];

      // Mark access code as used if not already
      if (!accessCodeDoc.usedBy) {
        accessCodeDoc.usedBy = participant._id;
        accessCodeDoc.usedAt = new Date();
        await accessCodeDoc.save({ session });
      }
    }

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json({
      message: 'Participant joined successfully',
      participant: participant,
      isRejoin: !!inactiveParticipant
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    
    return NextResponse.json({ 
      message: error.message || 'Failed to join as participant' 
    }, { status: 500 });
  }
} 