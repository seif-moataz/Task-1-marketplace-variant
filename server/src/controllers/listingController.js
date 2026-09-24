import Joi from 'joi';
import { Listing } from '../models/Listing.js';

// TODO: write a validation schema for create/update per README.md section 2.

const listingValidationSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string(),
  price: Joi.number().positive().required(),
  category: Joi.string().valid('textbooks', 'electronics', 'furniture', 'clothing', 'other').default('other'),
  condition: Joi.string().valid('new', 'like-new', 'used', 'worn').default('used'),
  status: Joi.string().valid('active', 'sold', 'removed').default('active'),
  seller: Joi.string().hex().length(24),
});

const updateListingSchema = Joi.object({
  title: Joi.string().trim(),
  description: Joi.string().allow(''),
  price: Joi.number().min(0),
  category: Joi.string().valid('textbooks', 'electronics', 'furniture', 'clothing', 'other'),
  condition: Joi.string().valid('new', 'like-new', 'used', 'worn'),
  status: Joi.string().valid('active', 'removed'),
  seller: Joi.string().hex().length(24),
}).min(1);

// GET /api/listings
// TODO: implement per README.md section 3.
export async function getAllListings(req, res, next) {
  try {
    const filter = req.query.includeRemoved === 'true' ? {} : { status: { $ne: 'removed' } };
    const listings = await Listing.find(filter).populate('seller', 'name email').sort({ createdAt: -1 });
    res.json(listings);
  } catch (err) { next(err); }
}

// GET /api/listings/:id
// TODO: implement per README.md sections 3 and 5.
export async function getListing(req, res, next) {
  try {
    const filter = { _id: req.params.id };
    if (req.query.includeRemoved !== 'true') {
      filter.status = { $ne: 'removed' };
    }

    const listing = await Listing.findOne(filter).populate('seller', 'name email');
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json(listing);
  } catch (err) { next(err); }
}

// POST /api/listings
// TODO: implement per README.md section 3.
export async function createListing(req, res, next) {
  try {
    const { error, value } = createListingSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const listing = await Listing.create(value);
    res.status(201).json(listing);
  } catch (err) { next(err); }
}

// PATCH /api/listings/:id
// TODO: implement per README.md sections 3 and 5.
export async function updateListing(req, res, next) {
  try {
    const { error, value } = updateListingSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const existing = await Listing.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Listing not found' });

    if (existing.status === 'sold') {
      return res.status(409).json({ message: 'Sold listings cannot be edited' });
    }

    Object.assign(existing, value);
    await existing.save();
    res.json(existing);
  } catch (err) { next(err); }
}

// DELETE /api/listings/:id
// TODO: implement per README.md sections 4 and 5.
export async function deleteListing(req, res, next) {
  try {
    const listing = await Listing.findOneAndUpdate(
      { _id: req.params.id, status: { $ne: 'removed' } },
      { status: 'removed' },
      { new: true }
    );
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json(listing); 
  } catch (err) { next(err); }
}

// PATCH /api/listings/:id/sold
export async function markListingSold(req, res, next) {
  try {
    const listing = await Listing.findOne({
      _id: req.params.id,
      status: { $ne: 'removed' },
    });
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    if (listing.status === 'sold') {
      return res.status(409).json({ message: 'Listing is already sold' });
    }

    listing.status = 'sold';
    await listing.save();
    res.json(listing);
  } catch (err) { next(err); }
}