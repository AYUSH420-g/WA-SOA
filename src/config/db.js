/**
 * MongoDB Database Connection Configuration
 * Uses Mongoose to connect to MongoDB Atlas cluster specified in .env
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoURI || mongoURI.includes('dummy_user')) {
    console.warn('\n⚠️ WARNING: Using dummy database URI or URI not provided.');
    console.warn('⚠️ Please set MONGO_URI or MONGODB_URI in your environment or .env file.\n');
  }

  const maxRetries = 5;
  const retryDelay = 2000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (mongoURI) {
        const conn = await mongoose.connect(mongoURI, {
          serverSelectionTimeoutMS: 5000 // 5 seconds timeout for connection attempts
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        return conn;
      }
    } catch (error) {
      console.error(`❌ MongoDB Connection Attempt ${attempt}/${maxRetries} Error: ${error.message}`);
      if (attempt < maxRetries) {
        console.log(`⏳ Retrying MongoDB connection in ${retryDelay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      } else {
        console.warn('⚠️ Server will operate, but database operations may fail until MongoDB is available.');
      }
    }
  }
};

module.exports = connectDB;
