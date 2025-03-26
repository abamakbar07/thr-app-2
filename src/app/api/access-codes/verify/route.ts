import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/connection";
import { AccessCode, Room, Participant } from "@/lib/db/models";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const { accessCode, roomCode } = await request.json();

    if (!accessCode || !roomCode) {
      return NextResponse.json({ error: "Access code and room code are required" }, { status: 400 });
    }

    console.log('Verifying accessCode:', accessCode, 'for roomCode:', roomCode);

    // Find the room
    const room = await Room.findOne({ accessCode: roomCode });
    
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Find and validate the access code
    const codeDoc = await AccessCode.findOne({ 
      code: accessCode,
      roomId: room._id
    });
    
    if (!codeDoc) {
      return NextResponse.json({ error: "Invalid access code" }, { status: 400 });
    }

    if (!codeDoc.isActive) {
      return NextResponse.json({ error: "Access code is inactive" }, { status: 400 });
    }

    // Check if this access code has been used before
    if (codeDoc.usedBy) {
      // Check if the participant exists and is just rejoining
      const participant = await Participant.findOne({
        accessCode: accessCode,
        roomId: room._id
      });

      if (participant) {
        // Access code is being reused by the same participant (rejoining)
        return NextResponse.json({ 
          message: "Access code verified successfully for returning participant", 
          roomId: room._id,
          accessCodeId: codeDoc._id,
          participantId: participant._id,
          participantName: participant.name,
          isReturning: true
        }, { status: 200 });
      } else {
        // Access code has been used but participant record not found
        // This could happen if participant was deleted but access code was marked as used
        return NextResponse.json({ 
          message: "Access code verified but original participant not found", 
          roomId: room._id,
          accessCodeId: codeDoc._id,
          isReturning: false,
          error: "Access code has been used but participant not found"
        }, { status: 400 });
      }
    }
    
    // New access code, never used before
    return NextResponse.json({ 
      message: "Access code verified successfully for new participant", 
      roomId: room._id,
      accessCodeId: codeDoc._id,
      isReturning: false
    }, { status: 200 });
  } catch (error) {
    console.error("Error verifying access code:", error);
    return NextResponse.json({ error: "Failed to verify access code" }, { status: 500 });
  }
} 