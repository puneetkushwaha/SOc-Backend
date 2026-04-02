const mongoose = require('mongoose');

let isConnected = false;
let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000; // 3 seconds
const EXPONENTIAL_BACKOFF_MULTIPLIER = 2;

const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    
    // Disable buffering immediately to prevent timeout errors
    mongoose.set('bufferCommands', false);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
      socketTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      retryWrites: false,
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 30000
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    isConnected = true;
    connectionAttempts = 0; // Reset on successful connection

    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB connection error: ${err}`);
      isConnected = false;
      attemptReconnect();
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected.');
      isConnected = false;
      attemptReconnect();
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
      isConnected = true;
    });

  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    isConnected = false;
    connectionAttempts++;
    
    if (connectionAttempts <= MAX_RECONNECT_ATTEMPTS) {
      const delay = RECONNECT_DELAY * Math.pow(EXPONENTIAL_BACKOFF_MULTIPLIER, connectionAttempts - 1);
      console.log(`🔄 Attempting reconnection in ${delay/1000}s (Attempt ${connectionAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
      
      setTimeout(connectDB, delay);
    } else {
      console.log('⚠️  Max reconnection attempts reached. Continuing in MOCK DATA MODE.');
      console.log('💡 Mock data service enabled for demonstration purposes');
    }
  }
};

// Helper function to check connection status
const isDatabaseConnected = () => isConnected;

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    process.exit(1);
  }
});

module.exports = connectDB;
module.exports.isDatabaseConnected = isDatabaseConnected;
