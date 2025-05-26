/**
 * MongoDB Connection Utility using Mongoose
 * Optimized for serverless environments like Next.js API routes
 */
import mongoose from 'mongoose';

// Connection URI
const MONGODB_URI = process.env.MONGODB_URI || '';

// Add error handling for missing connection string
if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is not set');
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Connection options optimized for Vercel and serverless environments
const options = {
  bufferCommands: false,
  autoIndex: false, // Don't build indexes in production
  maxPoolSize: 20, // Increased pool size
  minPoolSize: 5, // Ensure minimum connections are maintained
  serverSelectionTimeoutMS: 15000, // Reduced from 30000
  socketTimeoutMS: 30000, // Reduced from 45000
  family: 4,
  connectTimeoutMS: 10000,
  heartbeatFrequencyMS: 30000 // More frequent heartbeats
};

// Declare global mongoose cache
declare global {
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
    lastConnectionTime: number | null;
  } | null;
}

// Initialize the connection cache with timestamp
const globalCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
  lastConnectionTime: null
};

// Make sure to create the global cache if it doesn't exist
if (!global.mongooseCache) {
  global.mongooseCache = globalCache;
}

// Connection idle timeout - reconnect if 30 minutes have passed
const IDLE_CONNECTION_TIMEOUT = 30 * 60 * 1000;

/**
 * Connect to MongoDB using Mongoose
 * @returns Mongoose connection instance
 */
export async function connectToDatabase() {
  if (globalCache.conn) {
    console.log('Using existing MongoDB connection');
    return globalCache.conn;
  }

  if (!globalCache.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log('Creating new MongoDB connection');
    globalCache.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('MongoDB connected successfully');
      
      // Add connection event listeners for monitoring - only in development
      if (process.env.NODE_ENV === 'development' && mongoose.connection) {
        mongoose.connection.on('connected', () => {
          console.log('Mongoose connected to MongoDB');
        });

        mongoose.connection.on('error', (err) => {
          console.error('Mongoose connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
          console.log('Mongoose disconnected from MongoDB');
        });
      }
      
      return mongoose;
    });
  }
  
  try {
    globalCache.conn = await globalCache.promise;
    
    // Log the available models in mongoose
    const modelNames = mongoose.modelNames();
    console.log('Available Mongoose models:', modelNames);
    
    globalCache.lastConnectionTime = Date.now();
    return globalCache.conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

/**
 * Close MongoDB connection
 * This should only be called when the application is shutting down
 * or during development when you need to reset the connection
 */
export async function closeConnection(): Promise<void> {
  if (globalCache.conn) {
    await mongoose.disconnect();
    globalCache.conn = null;
    globalCache.promise = null;
    globalCache.lastConnectionTime = null;
    
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('MongoDB connection closed');
    }
  }
}

// Export connection utilities
export default { connectToDatabase, closeConnection }; 