// lib/db.js or utils/db.js
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://ayve012:7rEiTYl23T5iSMuj@ayv02.jiumxd9.mongodb.net/blog-app';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Global cache for connection across hot reloads (dev only)
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const ConnectDB = async () => {
  if (cached.conn) {
    console.log('💚 Using cached MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log('✅ MongoDB connected successfully');
      console.log('📊 Connection info:', {
        readyState: mongooseInstance.connections[0].readyState,
        host: mongooseInstance.connections[0].host,
        port: mongooseInstance.connections[0].port,
        name: mongooseInstance.connections[0].name,
      });
      return mongooseInstance;
    }).catch((error) => {
      console.error('❌ MongoDB connection error:', error);
      throw new Error(`Database connection failed: ${error.message}`);
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
};

// Optional: log mongoose events (dev only)
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  Mongoose disconnected from MongoDB');
});

// Optional: Graceful shutdown (Node.js)
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed through app termination');
    process.exit(0);
  });
}

export default ConnectDB;
