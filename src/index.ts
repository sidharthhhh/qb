import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import categoryRoutes from './routes/categoryRoutes';
import quotationRoutes from './routes/quotation';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
// Add more routes later: /api/categories, /api/products, etc.
app.use('/api/categories', categoryRoutes);
app.use('/api/quotation', quotationRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
