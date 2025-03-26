import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import { 
  validateDatabaseRelationships, 
  findDuplicateAnswers, 
  validateRewardQuantities,
  validateParticipantRupiah
} from '@/lib/db/utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';

export async function GET(req: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    // Connect to database
    await dbConnect();

    // Run validation checks
    const [
      relationshipResults,
      duplicateAnswers,
      inconsistentRewards,
      inconsistentRupiah
    ] = await Promise.all([
      validateDatabaseRelationships(),
      findDuplicateAnswers(),
      validateRewardQuantities(),
      validateParticipantRupiah()
    ]);

    // Compile validation results
    const validationResults = {
      relationshipValidation: relationshipResults,
      duplicateAnswers: {
        count: duplicateAnswers.length,
        details: duplicateAnswers
      },
      inconsistentRewards: {
        count: inconsistentRewards.length,
        details: inconsistentRewards
      },
      inconsistentRupiah: {
        count: inconsistentRupiah.length,
        details: inconsistentRupiah
      }
    };

    // Return validation results
    return NextResponse.json(validationResults);
  } catch (error) {
    console.error('Database validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate database' },
      { status: 500 }
    );
  }
} 