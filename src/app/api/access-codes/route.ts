import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/connection";
import { AccessCode } from "@/lib/db/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    const query: any = {};
    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;
    
    const accessCodes = await AccessCode.find(query)
      .populate("createdBy", "name email")
      .populate("usedBy", "name email")
      .sort({ createdAt: -1 });
    
    return NextResponse.json(accessCodes, { status: 200 });
  } catch (error) {
    console.error("Error fetching access codes:", error);
    return NextResponse.json({ error: "Failed to fetch access codes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { count = 1 } = await request.json();
    const codes = [];

    for (let i = 0; i < count; i++) {
      const code = uuidv4().substring(0, 8).toUpperCase();
      codes.push({
        code,
        createdBy: session.user.id,
        isActive: true,
      });
    }

    const createdCodes = await AccessCode.insertMany(codes);
    
    return NextResponse.json(createdCodes, { status: 201 });
  } catch (error) {
    console.error("Error creating access codes:", error);
    return NextResponse.json({ error: "Failed to create access codes" }, { status: 500 });
  }
} 