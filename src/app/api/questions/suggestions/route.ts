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
    const category = url.searchParams.get('category') || '';
    const difficulty = url.searchParams.get('difficulty') || '';
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const skip = parseInt(url.searchParams.get('skip') || '0', 10);
    
    // Build query to filter by category/difficulty if provided
    const query: any = {
      isDisabled: false // Only include active questions
    };
    
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    
    // Fetch all questions with pagination
    const questions = await Question.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('roomId', 'name');
    
    return NextResponse.json({
      questions,
      totalCount: await Question.countDocuments(query),
      hasMore: questions.length === limit
    });
  } catch (error) {
    console.error('Error fetching question suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question suggestions' },
      { status: 500 }
    );
  }
} 