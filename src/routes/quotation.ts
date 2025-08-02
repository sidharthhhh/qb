import express from 'express';
import { getQuotationPreview, saveQuotation } from '../controllers/quotationController';

const router = express.Router();

// POST /api/quotation/preview → calculate quotation
router.post('/preview', getQuotationPreview);

// POST /api/quotation/save → persist quotation
router.post('/save', saveQuotation);

export default router;
