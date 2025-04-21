/**
 * Database Collection Cleaning Script
 */

import mongoose from 'mongoose';
import readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Parse command line arguments
const args = process.argv.slice(2);
const shouldList = args.includes('--list');
const shouldClean = args.includes('--clean');
const force = args.includes('--force');

// Function to load environment variables
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');

  console.log(`Loading environment from: ${envPath}`);

  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8')
        .split('\n')
        .filter(line => line.trim() !== '' && !line.startsWith('#'))
        .reduce((acc, line) => {
          const [key, ...valueParts] = line.split('=');
          const value = valueParts.join('=').trim();
          if (key && value) {
            acc[key.trim()] = value;
          }
          return acc;
        }, {} as Record<string, string>);

    Object.keys(envConfig).forEach(key => {
      process.env[key] = envConfig[key];
    });

    console.log('Environment variables loaded successfully');
  } else {
    console.warn('Warning: .env.local file not found');
  }
}

// Load environment variables
loadEnv();

// Check if MONGODB_URI is set and ensure it's a string
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('❌ Error: MONGODB_URI environment variable is not set');
  console.log('Make sure you have a .env.local file in the root directory with a MONGODB_URI variable');
  process.exit(1);
}

// Now mongoUri is guaranteed to be a string
const MONGODB_URI: string = mongoUri;

// Safety check for production environment
if (process.env.NODE_ENV === 'production' && shouldClean) {
  console.error('❌ Error: Cannot clean collections in production environment');
  process.exit(1);
}

// Connect to database with proper type checking
async function connectToDatabase() {
  console.log('Connecting to MongoDB...');
  try {
    await mongoose.connect(MONGODB_URI);

    // Check if connection is established
    const connectionState = mongoose.connection.readyState;
    if (connectionState !== 1) {
      console.error('❌ Error: Failed to establish MongoDB connection');
      process.exit(1);
    }

    console.log('✅ Connected to MongoDB');
    return mongoose;
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

// Close connection
async function closeConnection() {
  try {
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('MongoDB connection closed');
    }
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
}

// Function to list all collections
async function listCollections() {
  try {
    await connectToDatabase();

    // Ensure connection and db are established
    if (!mongoose.connection.db) {
      console.error('❌ Error: MongoDB connection not fully established');
      return;
    }

    const collections = await mongoose.connection.db.collections();

    console.log('\n📋 Collections in the database:');
    console.log('---------------------------');

    if (collections.length === 0) {
      console.log('No collections found');
    } else {
      for (const collection of collections) {
        const count = await collection.countDocuments();
        console.log(`- ${collection.collectionName} (${count} documents)`);
      }
    }

    console.log('---------------------------');
  } catch (error) {
    console.error('❌ Error listing collections:', error);
  }
}

// Function to clean all collections
async function cleanCollections() {
  try {
    await connectToDatabase();

    // Ensure connection and db are established
    if (!mongoose.connection.db) {
      console.error('❌ Error: MongoDB connection not fully established');
      return;
    }

    const collections = await mongoose.connection.db.collections();

    if (collections.length === 0) {
      console.log('No collections found to clean');
      return;
    }

    // Show collections that will be cleaned
    console.log('\n⚠️  The following collections will be emptied:');
    console.log('------------------------------------------');
    for (const collection of collections) {
      const count = await collection.countDocuments();
      console.log(`- ${collection.collectionName} (${count} documents)`);
    }
    console.log('------------------------------------------');

    // Ask for confirmation unless force flag is used
    if (!force) {
      const answer = await new Promise<string>((resolve) => {
        rl.question('\n⚠️  WARNING: This will delete ALL data in ALL collections. This action cannot be undone.\nAre you sure you want to continue? (yes/no): ', resolve);
      });

      if (answer.toLowerCase() !== 'yes') {
        console.log('Operation cancelled');
        return;
      }
    }

    // Clean each collection
    console.log('\n🧹 Cleaning collections...');
    for (const collection of collections) {
      const collectionName = collection.collectionName;
      const count = await collection.countDocuments();

      if (count > 0) {
        await collection.deleteMany({});
        console.log(`✅ Cleaned ${collectionName} (${count} documents removed)`);
      } else {
        console.log(`ℹ️  Skipped ${collectionName} (already empty)`);
      }
    }

    console.log('\n✅ All collections have been cleaned successfully');
  } catch (error) {
    console.error('❌ Error cleaning collections:', error);
  }
}

// Main function
async function main() {
  try {
    if (!shouldList && !shouldClean) {
      console.log(`
Usage:
  npm run clean-db -- --list         List all collections
  npm run clean-db -- --clean        Clean all collections (with confirmation)
  npm run clean-db -- --clean --force Clean all collections (without confirmation)
      `);
      return;
    }

    if (shouldList) {
      await listCollections();
    }

    if (shouldClean) {
      await cleanCollections();
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await closeConnection();
    rl.close();
  }
}

// Run the script
main();