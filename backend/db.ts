import mongoose from 'mongoose';

/**
 * Connects to MongoDB using the connection string from environment variables or default.
 * Exits the process if connection fails.
 * 
 * Note: dotenv.config() is called in server.ts before this function is invoked.
 */
async function connectDB(): Promise<void> {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost/TasksDB';
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected!');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}

export default connectDB;