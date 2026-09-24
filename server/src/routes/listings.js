import { Router } from 'express';
import {
  getAllListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  markListingSold
} from '../controllers/listingController.js';

const router = Router();

router.get('/', getAllListings);
router.post('/', createListing);
router.get('/:id', getListing);
router.patch('/:id', updateListing);
router.delete('/:id', deleteListing);
router.patch('/:id/sold',markListingSold);

export default router;
