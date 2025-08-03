import { Router } from 'express';
import { getAllCategories, getCategoryOptions } from '../controllers/categoryController';

const router = Router();

// Route to get all categories
router.get('/', getAllCategories);

// Route to get options for a specific category (materials, sizes, accessories, etc.)
router.get('/:id/options', getCategoryOptions);

export default router;
