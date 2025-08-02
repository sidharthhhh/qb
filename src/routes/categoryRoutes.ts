import { Router } from 'express';
import { getCategoryOptions } from '../controllers/categoryController';

const router = Router();

router.get('/:id/options', getCategoryOptions);

export default router;
