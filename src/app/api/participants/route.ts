import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import { Room, Participant, AccessCode } from '@/lib/db/models';
import mongoose from 'mongoose';
import { z } from 'zod';

// Schema validation for participant joining
const participantSchema = z.object({
  roomId: z.string().min(1),
  name: z.string().min(1).max(50),
  accessCode: z.string().min(1),
  accessCodeId: z.string().optional()
});

export async function POST(req: NextRequest) {
  // Start MongoDB session for transaction
  const session = await mongoose.startSession();

  try {    
    await dbConnect();
    
    // Parse and validate request body
    const body = await req.json();
    const validation = participantSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.format() },
        { status: 400 }
      );
    }
    
    const { roomId, name, accessCode, accessCodeId } = validation.data;
    
    // Start transaction
    session.startTransaction();
    
    // Convert string ID to ObjectId
    const roomObjectId = new mongoose.Types.ObjectId(roomId);

    // Verify room exists and is active
    const room = await Room.findOne({ 
      _id: roomObjectId, 
      isActive: true 
    }).session(session);
    
    if (!room) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: 'Room not found or inactive' },
        { status: 404 }
      );
    }

    // Check if access code is already in use by a participant
    const existingParticipant = await Participant.findOne({ 
      accessCode 
    }).session(session);
    
    if (existingParticipant) {
      // If participant with this code exists and is linked to this room, update name
      if (existingParticipant.roomId.toString() === roomId) {
        existingParticipant.name = name;
        existingParticipant.currentStatus = 'active';
        await existingParticipant.save({ session });

        await session.commitTransaction();
        
        return NextResponse.json(
          {
            message: 'Successfully rejoined the room',
            participant: {
              _id: existingParticipant._id.toString(),
              name: existingParticipant.name,
              roomId: existingParticipant.roomId.toString(),
              totalRupiah: existingParticipant.totalRupiah,
            },
          },
          { status: 200 }
        );
      } else {
        await session.abortTransaction();
        return NextResponse.json(
          { error: 'Access code is already in use for another room' },
          { status: 400 }
        );
      }
    }

    // Verify the access code is valid and not used
    const accessCodeObjectId = accessCodeId 
      ? new mongoose.Types.ObjectId(accessCodeId) 
      : undefined;
    
    const codeDoc = accessCodeObjectId 
      ? await AccessCode.findById(accessCodeObjectId).session(session)
      : await AccessCode.findOne({ 
          code: accessCode, 
          roomId: roomObjectId,
          isActive: true
        }).session(session);

    if (!codeDoc) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: 'Invalid access code' },
        { status: 400 }
      );
    }

    if (!codeDoc.isActive) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: 'Access code is inactive' },
        { status: 400 }
      );
    }

    if (codeDoc.usedBy) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: 'Access code has already been used' },
        { status: 400 }
      );
    }

    // Create new participant
    const participant = await Participant.create([{
      name,
      roomId: roomObjectId,
      totalRupiah: 0,
      accessCode,
      joinedAt: new Date(),
      currentStatus: 'active',
    }], { session });

    // Mark the access code as used
    codeDoc.usedBy = participant[0]._id;
    codeDoc.usedAt = new Date();
    await codeDoc.save({ session });

    // Commit the transaction
    await session.commitTransaction();

    return NextResponse.json(
      {
        message: 'Successfully joined the room',
        participant: {
          _id: participant[0]._id.toString(),
          name: participant[0].name,
          roomId: participant[0].roomId.toString(),
          totalRupiah: participant[0].totalRupiah,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    
    console.error('Error joining room:', error);
    
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.message 
      }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    // End session
    session.endSession();
  }
} 