// lib/config/db.js
// Make sure your database connection looks like this:

import mongoose from 'mongoose';

const connection = {};

export const ConnectDB = async () => {
  try {
    // If already connected, return existing connection
    if (connection.isConnected) {
      console.log('💚 Using existing database connection');
      return;
    }

    // Check if MongoDB URI is provided
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    console.log('🔗 Connecting to MongoDB...');
    
    // Connect to MongoDB with proper options
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
      bufferMaxEntries: 0 // Disable mongoose buffering
    });

    connection.isConnected = db.connections[0].readyState;
    console.log('✅ MongoDB connected successfully');
    
    // Log connection details (without sensitive info)
    console.log('📊 Connection info:', {
      readyState: db.connections[0].readyState,
      host: db.connections[0].host,
      port: db.connections[0].port,
      name: db.connections[0].name
    });

  } catch (error) {
    console.error('❌ MongoDB connection error:', {
      message: error.message,
      code: error.code,
      name: error.name
    });
    
    // Provide more specific error messages
    if (error.message.includes('MONGODB_URI')) {
      throw new Error('MongoDB connection string is missing. Please check your environment variables.');
    } else if (error.message.includes('authentication')) {
      throw new Error('MongoDB authentication failed. Please check your credentials.');
    } else if (error.message.includes('timeout')) {
      throw new Error('MongoDB connection timeout. Please check your network connection.');
    } else {
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  Mongoose disconnected from MongoDB');
  connection.isConnected = false;
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🔌 MongoDB connection closed through app termination');
  process.exit(0);
});

export default ConnectDB;
