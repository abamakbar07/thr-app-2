import { getServerSession } from 'next-auth';
import { cache } from 'react';
import dbConnect from '@/lib/db/connection';
import { User } from '@/lib/db/models';

export const getSession = cache(async () => {
  return await getServerSession();
});

export async function getCurrentUser() {
  const session = await getSession();
  
  // Check if session and user exist
  if (!session?.user) {
    return null;
  }

  // Log session information for debugging
  // console.log('Session user:', JSON.stringify(session.user));

  // If user ID exists in session, return the user
  if (session.user.id) {
    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email
    };
  }
  
  // If no ID but we have email, try to find the user in the database
  if (session.user.email) {
    // console.log('User ID missing from session, fetching from database by email:', session.user.email);
    
    try {
      await dbConnect();
      const dbUser = await User.findOne({ email: session.user.email });
      
      if (dbUser) {
        // console.log('Found user in database by email:', dbUser._id.toString());
        return {
          id: dbUser._id.toString(),
          name: dbUser.name,
          email: dbUser.email
        };
      }
    } catch (error) {
      console.error('Error fetching user from database:', error);
    }
  }
  
  // If we still don't have an ID, log the error and return null
  console.error('Unable to determine user ID - session may be invalid');
  return null;
} 