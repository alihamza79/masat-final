import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db/mongodb';
import User, { IUser } from '@/models/User';

export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    
    // Facebook OAuth Provider
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    
    // Credentials Provider
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await connectToDatabase();
          
          const user = await User.findOne({ 
            email: credentials.email.toLowerCase() 
          }) as IUser;
          
          if (!user || !user.password) {
            return null;
          }
          
          const isPasswordValid = await bcrypt.compare(
            credentials.password, 
            user.password
          );
          
          if (!isPasswordValid) {
            return null;
          }

          // Update credentials linked flag
          await User.findByIdAndUpdate(user._id, {
            credentialsLinked: true
          });

          return {
            id: String(user._id),
            email: user.email,
            name: user.name || user.email,
            image: user.image || null,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'credentials') {
        return true;
      }

      if (account?.provider === 'google' || account?.provider === 'facebook') {
        try {
          await connectToDatabase();
          
          const existingUser = await User.findOne({ 
            email: profile?.email?.toLowerCase() 
          }) as IUser;

          if (existingUser) {
            // Update provider link
            const updateField = account.provider === 'google' ? 'googleLinked' : 'facebookLinked';
            await User.findByIdAndUpdate(existingUser._id, {
              [updateField]: true,
              ...(profile?.name && !existingUser.name && { name: profile.name }),
              ...(profile?.image && !existingUser.image && { image: profile.image }),
            });
            
            user.id = String(existingUser._id);
          } else {
            // Create new user
            const newUser = await User.create({
              email: profile?.email?.toLowerCase(),
              name: profile?.name || user.name,
              image: profile?.image || user.image,
              password: await bcrypt.hash(Math.random().toString(36), 10),
              googleLinked: account.provider === 'google',
              facebookLinked: account.provider === 'facebook',
              credentialsLinked: false,
              emailVerified: true,
            }) as IUser;
            
            user.id = String(newUser._id);
          }
        } catch (error) {
          console.error('SignIn callback error:', error);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Always redirect to dashboard after successful login
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    }
  },

  pages: {
    signIn: '/auth/auth1/login',
    error: '/auth/auth1/error',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,
}; 