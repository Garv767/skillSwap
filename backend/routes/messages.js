const express = require('express');
const { param, query } = require('express-validator');
const { protect, checkTradeParticipation } = require('../middleware/auth');
const messageController = require('../controllers/messageController');

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/messages/conversations
// @desc    Get user's recent conversations
// @access  Private
router.get('/conversations', messageController.getConversations);

// @route   GET /api/messages/trades/:tradeId
// @desc    Get messages for a trade
// @access  Private
router.get('/trades/:tradeId', [
  param('tradeId').isMongoId().withMessage('Invalid trade ID'),
  query('page').optional().isInt({min: 1}).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({min: 1, max: 100}).withMessage('Limit must be between 1-100')
], checkTradeParticipation, messageController.getTradeMessages);

// @route   GET /api/messages/unread-count
// @desc    Get unread messages count
// @access  Private
router.get('/unread-count', messageController.getUnreadCount);

// @route   PUT /api/messages/:id/read
// @desc    Mark message as read
// @access  Private
router.put('/:id/read', 
  param('id').isMongoId().withMessage('Invalid message ID'),
  messageController.markAsRead
);

module.exports = router;