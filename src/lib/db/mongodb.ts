/**
 * MongoDB Connection Utility using Mongoose
 * Optimized for serverless environments like Next.js API routes
 */
import mongoose from 'mongoose';

// Connection URI


const MONGODB_URI=process.env.MONGODB_URI || ''
// Connection options
const options = {
  bufferCommands: false,
  autoIndex: true,
  maxPoolSize: 10,
  minPoolSize: 1,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  family: 4
};

// Declare global mongoose cache
declare global {
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | null;
}

// Initialize the connection cache
const globalCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

// Make sure to create the global cache if it doesn't exist
if (!global.mongooseCache) {
  global.mongooseCache = globalCache;
}

/**
 * Connect to MongoDB using Mongoose
 * @returns Mongoose connection instance
 */
export async function connectToDatabase() {
  if (globalCache.conn) {
    return globalCache.conn;
  }

  if (!globalCache.promise) {
    const opts = {
      ...options,
      bufferCommands: false,
    };

    mongoose.set('strictQuery', true);
    
    globalCache.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('Connected to MongoDB with Mongoose');
      return mongoose;
    });
  }

  try {
    globalCache.conn = await globalCache.promise;
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
    console.log('MongoDB connection closed');
  }
}

// Add connection event listeners for monitoring
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});

// Handle process termination
process.on('SIGINT', async () => {
  await closeConnection();
  process.exit(0);
});

// Export connection utilities
export default { connectToDatabase, closeConnection }; 