import { Router } from 'express';
import {
  getQuotationPreview,
  saveQuotation,
  getQuotationById,
} from '../controllers/quotationController';

const router = Router();

router.post('/preview', getQuotationPreview);
router.post('/save', saveQuotation);
router.get('/:id', getQuotationById); // ✅ This is the new route

export default router;
