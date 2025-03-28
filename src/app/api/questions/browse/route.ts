import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import { Room, Question } from '@/lib/db/models';
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
    const category = url.searchParams.get('category') || '';
    const difficulty = url.searchParams.get('difficulty') || '';
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const skip = parseInt(url.searchParams.get('skip') || '0', 10);
    const searchTerm = url.searchParams.get('search') || '';
    
    // Build query for filtering
    const query: any = { 
      isDisabled: false // Only include active questions
    };
    
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (searchTerm) query.text = { $regex: searchTerm, $options: 'i' };
    
    // Fetch questions with pagination
    const questions = await Question.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('roomId', 'name createdBy')
      .populate({
        path: 'roomId',
        populate: {
          path: 'createdBy',
          model: 'User',
          select: 'name email'
        }
      });
    
    // Count total questions matching the query
    const totalCount = await Question.countDocuments(query);
    
    // Get categories for filtering
    const categories = await Question.distinct('category');
    
    return NextResponse.json({
      questions,
      totalCount,
      hasMore: skip + questions.length < totalCount,
      categories,
      currentPage: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    console.error('Error browsing questions:', error);
    return NextResponse.json(
      { error: 'Failed to browse questions' },
      { status: 500 }
    );
  }
} 