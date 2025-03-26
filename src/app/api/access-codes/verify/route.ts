import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/connection";
import { AccessCode, Room } from "@/lib/db/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accessCode, roomCode } = await request.json();

    if (!accessCode || !roomCode) {
      return NextResponse.json({ error: "Access code and room code are required" }, { status: 400 });
    }

    // Find the room
    const room = await Room.findOne({ code: roomCode });
    
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Find and validate the access code
    const codeDoc = await AccessCode.findOne({ code: accessCode });
    
    if (!codeDoc) {
      return NextResponse.json({ error: "Invalid access code" }, { status: 400 });
    }

    if (!codeDoc.isActive) {
      return NextResponse.json({ error: "Access code is inactive" }, { status: 400 });
    }

    if (codeDoc.usedBy) {
      return NextResponse.json({ error: "Access code has already been used" }, { status: 400 });
    }

    // Mark the access code as used
    codeDoc.usedBy = new mongoose.Types.ObjectId(session.user.id);
    codeDoc.usedAt = new Date();
    await codeDoc.save();
    
    return NextResponse.json({ message: "Access code verified successfully", roomId: room._id }, { status: 200 });
  } catch (error) {
    console.error("Error verifying access code:", error);
    return NextResponse.json({ error: "Failed to verify access code" }, { status: 500 });
  }
} 