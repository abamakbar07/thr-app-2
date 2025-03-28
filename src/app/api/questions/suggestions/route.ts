import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import { Question } from '@/lib/db/models';
import { getSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse query parameters
    const url = new URL(request.url);
    const currentRoomId = url.searchParams.get('currentRoomId') || '';
    const category = url.searchParams.get('category') || '';
    const difficulty = url.searchParams.get('difficulty') || '';
    const limit = parseInt(url.searchParams.get('limit') || '5', 10); // Default to 5
    const skip = parseInt(url.searchParams.get('skip') || '0', 10);
    const random = url.searchParams.get('random') === 'true';
    
    // Build query to exclude current room and filter by category/difficulty if provided
    const query: any = { 
      isDisabled: false // Only include active questions
    };
    
    // Exclude questions from current room if specified
    if (currentRoomId) {
      query.roomId = { $ne: currentRoomId };
    }
    
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    
    // For random selection
    let questions;
    
    if (random) {
      // Count total matching questions
      const totalCount = await Question.countDocuments(query);
      
      // Only proceed with aggregation if we have matching questions
      if (totalCount > 0) {
        questions = await Question.aggregate([
          { $match: query },
          { $sample: { size: limit } },
          { 
            $lookup: {
              from: 'rooms',
              localField: 'roomId',
              foreignField: '_id',
              as: 'roomInfo'
            }
          },
          { $unwind: '$roomInfo' },
          { 
            $project: {
              _id: 1,
              text: 1,
              options: 1,
              correctOptionIndex: 1,
              rupiah: 1,
              difficulty: 1,
              category: 1,
              explanation: 1,
              isDisabled: 1,
              imageUrl: 1,
              'roomId._id': '$roomInfo._id',
              'roomId.name': '$roomInfo.name'
            }
          }
        ]);
      } else {
        questions = [];
      }
      
      return NextResponse.json({
        questions,
        totalCount: questions.length,
        hasMore: false // With random we don't support pagination
      });
    } else {
      // Traditional pagination approach
      questions = await Question.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('roomId', 'name');
      
      // Count total questions matching the query
      const totalCount = await Question.countDocuments(query);
      
      return NextResponse.json({
        questions,
        totalCount,
        hasMore: skip + questions.length < totalCount
      });
    }
  } catch (error) {
    console.error('Error fetching question suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question suggestions' },
      { status: 500 }
    );
  }
} 