import express, { Request, Response } from 'express';  
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './db'; 
import authRoutes from './routes/auth'; 
import dailyRecordsRoutes from './routes/dailyrecords';
import statsRoutes from './routes/stats'; 
import userRoutes from './routes/userRoutes';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize app
const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // parses JSON bodies

// --- Define Routes ---

// Health check route
app.get('/', (req: Request, res: Response): void => {
  res.send('Backend API is running...');
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Daily records routes 
app.use('/api/dailyrecords', dailyRecordsRoutes);

// Stats routes
app.use('/api/stats', statsRoutes);

//Admin routes
// This connects the /api/users URL to userRoutes.ts file
app.use('/api/users', userRoutes); 

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));