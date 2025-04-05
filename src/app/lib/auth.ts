import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db/mongodb';
import User, { IUser } from '@/models/User';
import { ObjectId } from 'mongodb';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        try {
          // Connect to database
          await connectToDatabase();

          // Find user by email
          const user = await User.findOne({ email: credentials.email.toLowerCase() }) as IUser;
          
          // If user doesn't exist or password doesn't match
          if (!user || !(await bcrypt.compare(credentials.password, user.password))) {
            throw new Error('Invalid email or password');
          }

          // Mark this user as having used credentials login
          // Use direct MongoDB update to bypass schema validation
          const userId = user._id as unknown as ObjectId;
          await User.collection.updateOne(
            { _id: userId },
            { $set: { credentialsLinked: true } }
          );

          // Return user without password
          return {
            id: userId.toString(),
            email: user.email,
            name: user.name || '',
            image: user.image || '',
            // Only include these if they're used for UI display, otherwise omit
            googleLinked: true,
            credentialsLinked: true
          };
        } catch (error: any) {
          throw new Error(error.message || 'Authentication failed');
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // For Google logins, we need to check for existing accounts and link them
      if (account?.provider === "google" && profile?.email) {
        try {
          await connectToDatabase();
          
          // Check if user exists in our database with this email
          const existingUser = await User.findOne({ email: profile.email });
          
          if (existingUser) {
            // Use direct MongoDB update to set googleLinked flag and update profile
            await User.collection.updateOne(
              { email: profile.email },
              { 
                $set: { 
                  googleLinked: true,
                  // Only update name/image if they don't exist
                  ...((!existingUser.image && user.image) ? { image: user.image } : {}),
                  ...((!existingUser.name && user.name) ? { name: user.name } : {})
                }
              }
            );
          } else {
            // Create new user with Google profile data
            await User.collection.insertOne({
              email: profile.email,
              name: profile.name || user.name,
              image: profile.image || user.image,
              googleLinked: true,
              credentialsLinked: false,
              // Create a random password for the user
              password: await bcrypt.hash(Math.random().toString(36).slice(-10), 10),
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
        } catch (error) {
          console.error("Error during OAuth user creation:", error);
          // Don't fail the sign-in if we can't save to database
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user = {
          ...session.user,
          id: token.id as string,
        };
      }
      return session;
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/auth1/login',
    signOut: '/auth/auth1/login',
    error: '/auth/auth1/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 