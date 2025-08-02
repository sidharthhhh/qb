import { Router } from 'express';
import { getQuotationPreview } from '../controllers/quotationController';

const router = Router();

router.post('/preview', getQuotationPreview);

export default router;
