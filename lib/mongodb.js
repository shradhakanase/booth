import mongoose from 'mongoose';

const LOCAL_URI = 'mongodb://127.0.0.1:27017/booth_analysis';
const REMOTE_URI = process.env.MONGODB_URI;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const isProduction = process.env.NODE_ENV === 'production';
    const uri = process.env.MONGODB_URI || LOCAL_URI;

    if (isProduction && !process.env.MONGODB_URI) {
      throw new Error(
        'MONGODB_URI is missing in production environment variables. Please set MONGODB_URI in your deployment settings (e.g. Vercel, Render, or Railway) to your MongoDB Atlas connection string.'
      );
    }

    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose
      .connect(uri, opts)
      .catch((err) => {
        cached.promise = null;
        if (!isProduction && uri !== LOCAL_URI) {
          console.warn(`Cloud URI failed: ${err.message}. Retrying local MongoDB...`);
          return mongoose.connect(LOCAL_URI, opts);
        }
        console.error('MongoDB connection error:', err);
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;
