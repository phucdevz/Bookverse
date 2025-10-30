const express = require('express');
const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { auth } = require('../middlewares/auth');
const { validateReview, validateObjectId, validateQuery } = require('../middlewares/validation');

const router = express.Router();

// Helpers
async function hasPurchasedProduct(userId, productId) {
	const order = await Order.findOne({
		customer: userId,
		status: { $in: ['delivered'] },
		'items.product': productId
	});
	return !!order;
}

// @route   POST /api/reviews
// @desc    Create a review (only after delivered order)
// @access  Private
router.post('/', auth, validateReview, async (req, res) => {
	try {
		const { product, order, rating, title, comment, images, detailedRatings, isAnonymous } = req.body;

		// Ensure product exists and is active
		const productDoc = await Product.findById(product);
		if (!productDoc || !productDoc.isActive) {
			return res.status(400).json({ success: false, message: 'Invalid product' });
		}

		// Check purchase
		const eligible = await hasPurchasedProduct(req.user._id, product);
		if (!eligible) {
			return res.status(403).json({ success: false, message: 'You can only review products you have purchased and received' });
		}

		const review = new Review({
			product,
			customer: req.user._id,
			order,
			rating,
			title,
			comment,
			images,
			detailedRatings,
			isAnonymous: !!isAnonymous,
			status: 'approved'
		});

		await review.save();

		res.status(201).json({
			success: true,
			message: 'Review created successfully',
			data: { review: review.toJSON() }
		});
	} catch (error) {
		console.error('Create review error:', error);
		res.status(500).json({ success: false, message: 'Failed to create review', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
	}
});

// @route   GET /api/reviews/product/:productId
// @desc    List reviews for a product
// @access  Public
router.get('/product/:productId', validateObjectId('productId'), validateQuery, async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const skip = (page - 1) * limit;

		const productId = req.params.productId;
		const query = { product: productId, status: 'approved' };

		const reviews = await Review.find(query)
			.populate('customer', 'username profile.firstName profile.lastName')
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit);

		const total = await Review.countDocuments(query);

		res.json({
			success: true,
			data: { reviews, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }
		});
	} catch (error) {
		console.error('List product reviews error:', error);
		res.status(500).json({ success: false, message: 'Failed to get reviews', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
	}
});

// @route   PUT /api/reviews/:id
// @desc    Update own review
// @access  Private
router.put('/:id', auth, validateObjectId(), async (req, res) => {
	try {
		const review = await Review.findById(req.params.id);
		if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
		if (review.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
			return res.status(403).json({ success: false, message: 'You can only update your own review' });
		}

		const allowed = ['rating', 'title', 'comment', 'images', 'detailedRatings', 'isAnonymous'];
		for (const key of allowed) {
			if (req.body[key] !== undefined) review[key] = req.body[key];
		}
		await review.save();

		res.json({ success: true, message: 'Review updated successfully', data: { review: review.toJSON() } });
	} catch (error) {
		console.error('Update review error:', error);
		res.status(500).json({ success: false, message: 'Failed to update review', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
	}
});

// @route   DELETE /api/reviews/:id
// @desc    Delete own review
// @access  Private
router.delete('/:id', auth, validateObjectId(), async (req, res) => {
	try {
		const review = await Review.findById(req.params.id);
		if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
		if (review.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
			return res.status(403).json({ success: false, message: 'You can only delete your own review' });
		}
		await Review.deleteOne({ _id: review._id });
		res.json({ success: true, message: 'Review deleted successfully' });
	} catch (error) {
		console.error('Delete review error:', error);
		res.status(500).json({ success: false, message: 'Failed to delete review', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
	}
});

module.exports = router;


