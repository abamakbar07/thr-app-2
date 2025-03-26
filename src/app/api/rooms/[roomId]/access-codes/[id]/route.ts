import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/connection";
import { AccessCode } from "@/lib/db/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { roomId: string, id: string } }
) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, roomId } = params;
    const { isActive } = await request.json();

    const accessCode = await AccessCode.findOne({ _id: id, roomId });
    
    if (!accessCode) {
      return NextResponse.json({ error: "Access code not found" }, { status: 404 });
    }

    accessCode.isActive = isActive;
    await accessCode.save();
    
    return NextResponse.json(accessCode, { status: 200 });
  } catch (error) {
    console.error("Error updating access code:", error);
    return NextResponse.json({ error: "Failed to update access code" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { roomId: string, id: string } }
) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, roomId } = params;
    
    const result = await AccessCode.findOneAndDelete({ _id: id, roomId });
    
    if (!result) {
      return NextResponse.json({ error: "Access code not found" }, { status: 404 });
    }
    
    return NextResponse.json({ message: "Access code deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting access code:", error);
    return NextResponse.json({ error: "Failed to delete access code" }, { status: 500 });
  }
} 