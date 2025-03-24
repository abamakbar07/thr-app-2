import { getServerSession } from 'next-auth';
import { cache } from 'react';

export const getSession = cache(async () => {
  return await getServerSession();
});

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
} 