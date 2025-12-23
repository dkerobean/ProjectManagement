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

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
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

    cached!.promise = mongoose.connect(MONGODB_URI!, opts);
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
