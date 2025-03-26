import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
// Import any models you need
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import mongoose from 'mongoose';

/**
 * User interface for consistent authentication handling
 */
interface User {
  _id: string;
  name: string;
  email: string;
}

/**
 * GET request handler
 */
export async function GET(req: NextRequest) {
  try {
    // Step 1: Authenticate user with getServerSession
    const authSession = await getServerSession(authOptions);

    if (!authSession?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Step 2: Cast and validate user object
    const user = authSession.user as User;
    if (!user || !user._id) {
      return NextResponse.json({ error: 'User authentication issue - Please sign out and sign in again' }, { status: 401 });
    }
    
    // Step 3: Connect to database
    await dbConnect();
    
    // Step 4: Get query parameters if needed
    const url = new URL(req.url);
    const someParam = url.searchParams.get('someParam');
    
    // Step 5: Process request logic
    // Example: Find documents owned by the current user
    // const items = await SomeModel.find({ 
    //   createdBy: new mongoose.Types.ObjectId(user._id) 
    // });
    
    // Step 6: Return response with NextResponse.json
    return NextResponse.json({ 
      message: 'Success', 
      // data: items 
    }, { status: 200 });
  } catch (error) {
    console.error('Error in GET request:', error);
    
    let errorMessage = 'Server error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * POST request handler
 */
export async function POST(req: NextRequest) {
  try {
    // Step 1: Authenticate user with getServerSession
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Step 2: Cast and validate user object
    const user = authSession.user as User;
    if (!user || !user._id) {
      return NextResponse.json({ error: 'User authentication issue - Please sign out and sign in again' }, { status: 401 });
    }
    
    // Step 3: Parse request body
    const requestBody = await req.json();
    
    // Step 4: Validate input
    if (!requestBody.requiredField) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Step 5: Connect to database
    await dbConnect();
    
    // Step 6: Process request with MongoDB transaction if needed
    // For transactions:
    // const dbSession = await mongoose.startSession();
    // dbSession.startTransaction();
    // try {
    //   // Transaction operations
    //   await dbSession.commitTransaction();
    // } catch (error) {
    //   await dbSession.abortTransaction();
    //   throw error;
    // } finally {
    //   dbSession.endSession();
    // }
    
    // Step 7: Create/update document(s)
    // Always include the user ID in documents they create
    // const newItem = await SomeModel.create({
    //   ...requestBody,
    //   createdBy: new mongoose.Types.ObjectId(user._id)
    // });
    
    // Step 8: Return success response
    return NextResponse.json({ 
      message: 'Created successfully', 
      // itemId: newItem._id 
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST request:', error);
    
    let errorMessage = 'Server error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * PUT request handler
 */
export async function PUT(req: NextRequest) {
  try {
    // Authentication flow (same as above)
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = authSession.user as User;
    if (!user || !user._id) {
      return NextResponse.json({ error: 'User authentication issue - Please sign out and sign in again' }, { status: 401 });
    }
    
    await dbConnect();
    
    const requestBody = await req.json();
    
    // Ensure the item exists and belongs to this user
    // const item = await SomeModel.findOne({
    //   _id: requestBody.id,
    //   createdBy: new mongoose.Types.ObjectId(user._id)
    // });
    
    // if (!item) {
    //   return NextResponse.json({ error: 'Item not found or not authorized' }, { status: 404 });
    // }
    
    // Update the item
    // const updatedItem = await SomeModel.findByIdAndUpdate(
    //   requestBody.id,
    //   { $set: { ...requestBody } },
    //   { new: true }
    // );
    
    return NextResponse.json({ 
      message: 'Updated successfully', 
      // item: updatedItem 
    }, { status: 200 });
  } catch (error) {
    console.error('Error in PUT request:', error);
    
    let errorMessage = 'Server error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * DELETE request handler
 */
export async function DELETE(req: NextRequest) {
  try {
    // Authentication flow (same as above)
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = authSession.user as User;
    if (!user || !user._id) {
      return NextResponse.json({ error: 'User authentication issue - Please sign out and sign in again' }, { status: 401 });
    }
    
    await dbConnect();
    
    // Get item ID from URL or body
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }
    
    // Ensure the item exists and belongs to this user before deleting
    // const result = await SomeModel.findOneAndDelete({
    //   _id: id,
    //   createdBy: new mongoose.Types.ObjectId(user._id)
    // });
    
    // if (!result) {
    //   return NextResponse.json({ error: 'Item not found or not authorized' }, { status: 404 });
    // }
    
    return NextResponse.json({ message: 'Deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error in DELETE request:', error);
    
    let errorMessage = 'Server error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 