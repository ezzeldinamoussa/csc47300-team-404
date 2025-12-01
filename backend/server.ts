
import express, { Request, Response } from 'express';  
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './db'; 
import authRoutes from './routes/auth'; 
import dailyRecordsRoutes from './routes/dailyrecords';
import statsRoutes from './routes/stats'; 



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

// Example: basic users endpoint (placeholder)
app.get('/api/users', (req: Request, res: Response): void => {
  res.json({ message: 'Users endpoint working!' });
});

// Daily records routes 
app.use('/api/dailyrecords', dailyRecordsRoutes);

// Stats routes
app.use('/api/stats', statsRoutes);


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

