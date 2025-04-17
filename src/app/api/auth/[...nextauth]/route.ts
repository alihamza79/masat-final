import NextAuth from 'next-auth';
import { authOptions as baseAuthOptions } from '@/app/lib/auth';
import { JWT } from 'next-auth/jwt';

// Create a modified version of authOptions that handles the remember parameter
const authOptions = {
  ...baseAuthOptions,
  callbacks: {
    ...baseAuthOptions.callbacks,
    async jwt({ token, user, account, profile, trigger, session }: {
      token: JWT;
      user?: any;
      account?: any;
      profile?: any;
      trigger?: "signIn" | "signUp" | "update" | undefined;
      session?: any;
    }) {
      // First handle the base implementation
      if (baseAuthOptions.callbacks?.jwt) {
        token = await baseAuthOptions.callbacks.jwt({ 
          token, user, account, profile, trigger, session 
        });
      }
      
      // Store remember preference when user signs in
      if (user && 'remember' in user) {
        token.remember = user.remember;
        
        // Set expiry time based on remember preference
        const now = Math.floor(Date.now() / 1000);
        if (user.remember) {
          // 30 days for remembered devices
          token.exp = now + 30 * 24 * 60 * 60;
        } else {
          // 8 hours for non-remembered devices
          token.exp = now + 8 * 60 * 60;
        }
      }
      
      // Check if token is about to expire and user chose not to be remembered
      if (token.remember === false && typeof token.exp === 'number') {
        // If less than 15 minutes remaining and not remembered, don't refresh
        const now = Math.floor(Date.now() / 1000);
        if (token.exp - now < 15 * 60) {
          // Don't extend the token
          return token;
        }
      }
      
      return token;
    }
  }
};

// Create a NextAuth handler
const handler = NextAuth(authOptions);

// Export the handler for the API route
export { handler as GET, handler as POST };