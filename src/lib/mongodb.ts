/**
 * MongoDB Connection Utility
 * GoldTrader Pro - Database Connection
 */
import mongoose from 'mongoose';

declare global {
  // eslint-disable-next-line no-var
  var mongooseConnection: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongooseConnection;

if (!cached) {
  cached = global.mongooseConnection = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI;
      
  // If no URI during build, simple return or throw specific error handled by caller?
  // But caller usually expects connection.
  if (!MONGODB_URI) {
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
       console.warn('⚠️ MONGODB_URI is not defined, but skipping check during build.');
       // We can't return a valid connection here. 
       // If we return null, TS complains. 
       // If the build process tries to USE the connection, it will crash anyway. 
       // But often the error comes from top-level validation.
       // So just by removing top-level validation, we might be safe.
       // However, we still need to handle the runtime case.
    }
     // Runtime error if actually trying to connect without URI
     throw new Error('Please define the MONGODB_URI environment variable');
  }

  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

    cached!.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

/**
 * Get raw MongoDB client for direct operations
 */
export function getMongoClient() {
  if (!cached?.conn) {
    throw new Error('Database not connected. Call connectToDatabase() first.');
  }
  return cached.conn.connection.getClient();
}

/**
 * Get the goldtrader database
 */
export function getDatabase() {
  if (!cached?.conn) {
    throw new Error('Database not connected. Call connectToDatabase() first.');
  }
  return cached.conn.connection.db;
}

export default connectToDatabase;
