const express = require('express');
const { body, param } = require('express-validator');
const { protect, checkTradeParticipation } = require('../middleware/auth');
const tradeController = require('../controllers/tradeController');

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/trades
// @desc    Get user's trades
// @access  Private
router.get('/', tradeController.getUserTrades);

// @route   POST /api/trades
// @desc    Create new trade offer
// @access  Private
router.post('/', [
  body('provider').isMongoId().withMessage('Valid provider ID is required'),
  body('requestedSkill.name').notEmpty().withMessage('Requested skill name is required'),
  body('requestedSkill.level').isIn(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
  body('offeredSkill.name').notEmpty().withMessage('Offered skill name is required'),
  body('offeredSkill.level').isIn(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
  body('title').trim().isLength({min: 5, max: 100}).withMessage('Title must be between 5-100 characters'),
  body('description').trim().isLength({min: 10, max: 1000}).withMessage('Description must be between 10-1000 characters')
], tradeController.createTrade);

// @route   GET /api/trades/:id
// @desc    Get single trade
// @access  Private
router.get('/:id', 
  param('id').isMongoId().withMessage('Invalid trade ID'),
  checkTradeParticipation,
  tradeController.getTrade
);

// @route   PUT /api/trades/:id/status
// @desc    Update trade status
// @access  Private
router.put('/:id/status', [
  param('id').isMongoId().withMessage('Invalid trade ID'),
  body('status').isIn(['accepted', 'cancelled', 'in_progress', 'completed', 'disputed']).withMessage('Invalid status')
], checkTradeParticipation, tradeController.updateTradeStatus);

// @route   POST /api/trades/:id/review
// @desc    Add review for completed trade
// @access  Private
router.post('/:id/review', [
  param('id').isMongoId().withMessage('Invalid trade ID'),
  body('rating').isInt({min: 1, max: 5}).withMessage('Rating must be between 1-5'),
  body('comment').optional().trim().isLength({max: 500}).withMessage('Comment cannot exceed 500 characters')
], checkTradeParticipation, tradeController.addReview);

module.exports = router;