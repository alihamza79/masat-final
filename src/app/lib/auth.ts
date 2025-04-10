import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
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
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
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
          console.error('Authorization error:', error);
          throw new Error(error.message || 'Authentication failed');
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('Sign in callback with account provider:', account?.provider);
      // For Google or Facebook logins, we need to check for existing accounts and link them
      if ((account?.provider === "google" || account?.provider === "facebook") && profile?.email) {
        try {
          await connectToDatabase();
          
          // Check if user exists in our database with this email
          let existingUser = await User.findOne({ email: profile.email });
          let mongoDbUserId: string;
          
          if (existingUser) {
            // Use direct MongoDB update to set provider flag and update profile
            const providerFlag = account.provider === "google" ? "googleLinked" : "facebookLinked";
            console.log(`Updating existing user with ${providerFlag} = true`);
            
            await User.collection.updateOne(
              { email: profile.email },
              { 
                $set: { 
                  [providerFlag]: true,
                  // Only update name/image if they don't exist
                  ...((!existingUser.image && user.image) ? { image: user.image } : {}),
                  ...((!existingUser.name && user.name) ? { name: user.name } : {})
                }
              }
            );
            // Cast existingUser._id to ObjectId and then to string
            mongoDbUserId = (existingUser._id as unknown as ObjectId).toString();
          } else {
            // Create new user with provider profile data
            const providerFlag = account.provider === "google" ? "googleLinked" : "facebookLinked";
            console.log(`Creating new user with ${providerFlag} = true`);
            
            const newUser = await User.collection.insertOne({
              email: profile.email,
              name: profile.name || user.name,
              image: profile.image || user.image,
              [providerFlag]: true,
              credentialsLinked: false,
              // Create a random password for the user
              password: await bcrypt.hash(Math.random().toString(36).slice(-10), 10),
              createdAt: new Date(),
              updatedAt: new Date()
            });
            mongoDbUserId = newUser.insertedId.toString();
          }
          
          // Override the user id with our MongoDB user id
          user.id = mongoDbUserId;
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
  debug: process.env.NODE_ENV === 'development',
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