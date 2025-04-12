import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db/mongodb';
import User, { IUser } from '@/models/User';
import { ObjectId } from 'mongodb';

// Cache user lookup to reduce database operations
const userCache = new Map<string, any>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Function to get user from cache or database
async function getUserByEmail(email: string) {
  const normalizedEmail = email.toLowerCase();
  const cachedUser = userCache.get(normalizedEmail);
  
  if (cachedUser && cachedUser.timestamp > Date.now() - CACHE_TTL) {
    return cachedUser.user;
  }
  
  // Connect to database (this is already cached internally)
  await connectToDatabase();
  
  // Find user by email
  const user = await User.findOne({ email: normalizedEmail });
  
  // Cache the result
  if (user) {
    userCache.set(normalizedEmail, {
      user,
      timestamp: Date.now()
    });
  }
  
  return user;
}

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
          const user = await getUserByEmail(credentials.email) as IUser;
          
          // If user doesn't exist or password doesn't match
          if (!user || !(await bcrypt.compare(credentials.password, user.password))) {
            throw new Error('Invalid email or password');
          }

          // Mark this user as having used credentials login
          // Use direct MongoDB update to bypass schema validation
          const userId = user._id as unknown as ObjectId;
          
          // Update in database - don't await this to speed up login
          User.collection.updateOne(
            { _id: userId },
            { $set: { credentialsLinked: true } }
          ).catch(err => console.error('Error updating credentialsLinked flag:', err));

          // Return user without password
          return {
            id: userId.toString(),
            email: user.email,
            name: user.name || '',
            image: user.image || '',
            // Only include these if they're used for UI display, otherwise omit
            googleLinked: user.googleLinked || false,
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
      // Skip extra processing for credential login to speed up the process
      if (account?.provider === "credentials") {
        return true;
      }
      
      // For Google or Facebook logins, we need to check for existing accounts and link them
      if ((account?.provider === "google" || account?.provider === "facebook") && profile?.email) {
        try {
          // Check if user exists in our database with this email
          const existingUser = await getUserByEmail(profile.email);
          let mongoDbUserId: string;
          
          if (existingUser) {
            // Use direct MongoDB update to set provider flag and update profile
            const providerFlag = account.provider === "google" ? "googleLinked" : "facebookLinked";
            
            // Update in database - don't await this to speed up login
            User.collection.updateOne(
              { email: profile.email },
              { 
                $set: { 
                  [providerFlag]: true,
                  // Only update name/image if they don't exist
                  ...((!existingUser.image && user.image) ? { image: user.image } : {}),
                  ...((!existingUser.name && user.name) ? { name: user.name } : {})
                }
              }
            ).catch(err => console.error(`Error updating ${providerFlag} flag:`, err));
            
            // Cast existingUser._id to ObjectId and then to string
            mongoDbUserId = (existingUser._id as unknown as ObjectId).toString();
          } else {
            // Create new user with provider profile data
            const providerFlag = account.provider === "google" ? "googleLinked" : "facebookLinked";
            
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
    async jwt({ token, user }) {
      // Only update the token when a new sign in happens (user is available)
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  // Only enable debug in development
  debug: true, // Temporarily enable for production debugging
  pages: {
    signIn: '/auth/auth1/login',
    signOut: '/auth/auth1/login',
    error: '/auth/auth1/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Increase JWT maxAge for better caching
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days 
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 