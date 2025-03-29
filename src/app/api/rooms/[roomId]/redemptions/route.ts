import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import { Redemption, Room } from '@/lib/db/models';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';

export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    // Authenticate admin/organizer
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const { roomId } = await params;
    
    // Verify user is owner of the room
    const room = await Room.findOne({
      _id: roomId,
      createdBy: authSession.user.id
    });
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found or you do not have permission' }, { status: 404 });
    }
    
    // Get all redemptions for this room
    const redemptions = await Redemption.find({ roomId })
      .populate('participantId', 'name displayName') // Get participant details
      .populate('rewardId', 'name description rupiahRequired') // Get reward details
      .sort({ claimedAt: -1 }); // Sort by most recent first
    
    // Format the response
    const formattedRedemptions = redemptions.map(redemption => ({
      _id: redemption._id,
      participantId: redemption.participantId._id,
      participantName: redemption.participantId.displayName || redemption.participantId.name,
      rewardId: redemption.rewardId._id,
      rewardName: redemption.rewardId.name,
      rupiahSpent: redemption.rupiahSpent,
      status: redemption.status,
      claimedAt: redemption.claimedAt,
      notes: redemption.notes
    }));
    
    return NextResponse.json({
      success: true,
      count: formattedRedemptions.length,
      redemptions: formattedRedemptions
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching redemptions:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Server error while fetching redemptions'
    }, { status: 500 });
  }
} 