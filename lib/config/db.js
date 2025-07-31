// lib/config/db.js
import mongoose from 'mongoose';

const connection = {};

export const ConnectDB = async () => {
  try {
    console.log('🔍 Starting MongoDB connection process...');
    
    // If already connected, return existing connection
    if (connection.isConnected && mongoose.connection.readyState === 1) {
      console.log('✅ Using existing MongoDB connection');
      return;
    }

    // Check if MongoDB URI is provided
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI environment variable is missing');
      throw new Error('MONGODB_URI environment variable is not defined. Please add it to your .env.local file or Vercel environment variables.');
    }

    // Log URI format (without showing the actual URI for security)
    const uriStart = process.env.MONGODB_URI.substring(0, 20);
    console.log('🔗 MongoDB URI format check:', uriStart + '...');

    // Validate URI format
    if (!process.env.MONGODB_URI.startsWith('mongodb')) {
      console.error('❌ Invalid MongoDB URI format');
      throw new Error('MONGODB_URI must start with "mongodb://" or "mongodb+srv://"');
    }

    console.log('🔗 Attempting to connect to MongoDB...');
    
    // Disconnect any existing connections first
    if (mongoose.connection.readyState !== 0) {
      console.log('🔄 Closing existing connection...');
      await mongoose.disconnect();
    }

    // Connect to MongoDB with comprehensive options
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      // Connection options
      useNewUrlParser: true,
      useUnifiedTopology: true,
      
      // Pool settings
      maxPoolSize: 10,
      minPoolSize: 2,
      
      // Timeouts
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
      connectTimeoutMS: 30000, // 30 seconds
      
      // Buffer settings
      bufferCommands: false,
      bufferMaxEntries: 0,
      
      // Retry settings
      retryWrites: true,
      retryReads: true,
      
      // Other options
      compressors: 'zlib',
      maxIdleTimeMS: 30000,
      heartbeatFrequencyMS: 10000
    });

    connection.isConnected = db.connections[0].readyState;
    
    console.log('✅ MongoDB connected successfully!');
    console.log('📊 Connection details:', {
      readyState: db.connections[0].readyState,
      host: db.connections[0].host,
      port: db.connections[0].port,
      name: db.connections[0].name,
      models: Object.keys(mongoose.models)
    });

    return db;

  } catch (error) {
    console.error('❌ MongoDB connection failed:', {
      message: error.message,
      code: error.code,
      name: error.name,
      codeName: error.codeName
    });
    
    // Reset connection state
    connection.isConnected = false;
    
    // Provide specific error messages based on error type
    if (error.message.includes('MONGODB_URI')) {
      throw new Error('MongoDB URI is missing. Add MONGODB_URI to your environment variables.');
      
    } else if (error.message.includes('authentication') || error.message.includes('auth')) {
      throw new Error('MongoDB authentication failed. Check your username and password in the connection string.');
      
    } else if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
      throw new Error('MongoDB connection timeout. Check if MongoDB Atlas is accessible and your IP is whitelisted.');
      
    } else if (error.message.includes('network') || error.message.includes('ENOTFOUND')) {
      throw new Error('Network error connecting to MongoDB. Check your internet connection and MongoDB Atlas URL.');
      
    } else if (error.message.includes('serverless')) {
      throw new Error('MongoDB serverless issue. Try reconnecting or check MongoDB Atlas status.');
      
    } else if (error.codeName === 'AtlasError') {
      throw new Error('MongoDB Atlas error. Check your cluster status and configuration.');
      
    } else {
      throw new Error(`MongoDB connection error: ${error.message}`);
    }
  }
};

// Connection event handlers
mongoose.connection.on('connected', () => {
  console.log('🟢 Mongoose connected to MongoDB');
  connection.isConnected = true;
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 Mongoose connection error:', err.message);
  connection.isConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('🟡 Mongoose disconnected from MongoDB');
  connection.isConnected = false;
});

mongoose.connection.on('reconnected', () => {
  console.log('🟢 Mongoose reconnected to MongoDB');
  connection.isConnected = true;
});

// Handle process termination
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    try {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed through app termination');
    } catch (error) {
      console.error('Error closing MongoDB connection:', error);
    }
    process.exit(0);
  });
}

export default ConnectDB;
