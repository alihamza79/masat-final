/**
 * MongoDB Connection Utility using Mongoose
 * Optimized for serverless environments like Next.js API routes
 */
import mongoose from 'mongoose';

// Connection URI
const MONGODB_URI=process.env.MONGODB_URI || ''

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
  heartbeatFrequencyMS: 30000, // More frequent heartbeats
  // Set keepAlive to true to avoid connection issues
  keepAlive: true
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
  // Check if connection exists and is active
  if (globalCache.conn) {
    // Check connection state (0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting)
    const connectionState = mongoose.connection.readyState;
    
    // If connected and not expired
    if (connectionState === 1 && 
        globalCache.lastConnectionTime && 
        Date.now() - globalCache.lastConnectionTime < IDLE_CONNECTION_TIMEOUT) {
      return globalCache.conn;
    }
    
    // If connection is expired but still active, continue using it
    // but update the timestamp to avoid too many reconnections
    if (connectionState === 1) {
      globalCache.lastConnectionTime = Date.now();
      return globalCache.conn;
    }
  }

  // Use existing promise if connection is in progress
  if (globalCache.promise) {
    try {
      globalCache.conn = await globalCache.promise;
      globalCache.lastConnectionTime = Date.now();
      return globalCache.conn;
    } catch (e) {
      globalCache.promise = null;
      console.error("Error connecting to MongoDB, retrying:", e);
    }
  }

  // Create new connection
  const opts = {
    ...options,
    bufferCommands: false,
  };

  mongoose.set('strictQuery', true);
  
  // Create new connection promise
  globalCache.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
    // Only log in development to reduce Vercel logs
    if (process.env.NODE_ENV === 'development') {
      console.log('Connected to MongoDB with Mongoose');
    }
    return mongoose;
  });

  try {
    globalCache.conn = await globalCache.promise;
    globalCache.lastConnectionTime = Date.now();
  } catch (e) {
    globalCache.promise = null;
    throw e;
  }

  return globalCache.conn;
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

// Add connection event listeners for monitoring - only in development
if (process.env.NODE_ENV === 'development') {
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

// Handle process termination
process.on('SIGINT', async () => {
  await closeConnection();
  process.exit(0);
});

// Export connection utilities
export default { connectToDatabase, closeConnection }; 