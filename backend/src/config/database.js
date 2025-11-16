const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    let dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.warn('⚠️  DATABASE_URL not set, using default local MongoDB');
      dbUrl = 'mongodb://localhost:27017/baseball_cards';
    }
    
    // Ensure it's a string and trim whitespace
    dbUrl = String(dbUrl).trim();
    
    // Validate format
    if (!dbUrl || (!dbUrl.startsWith('mongodb://') && !dbUrl.startsWith('mongodb+srv://'))) {
      console.error(`❌ Invalid DATABASE_URL format. Expected mongodb:// or mongodb+srv://`);
      console.error(`   Got: ${dbUrl ? dbUrl.substring(0, 50) + '...' : 'undefined or empty'}`);
      return null;
    }
    
    console.log(`🔌 Attempting to connect to MongoDB...`);
    const conn = await mongoose.connect(dbUrl, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
    });
    console.log(`✅ MongoDB Connected successfully to: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('   Server will continue running, but database operations will fail.');
    console.error('   Please check your DATABASE_URL in .env file.');
    // Don't exit - allow server to start for testing
    return null;
  }
};

module.exports = connectDB;

