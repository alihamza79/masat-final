import NextAuth from 'next-auth';
import { authOptions } from '@/app/lib/auth';

// Create a NextAuth handler
const handler = NextAuth(authOptions);

// Export the handler for the API route
export { handler as GET, handler as POST };