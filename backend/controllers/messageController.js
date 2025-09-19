const Message = require('../models/Message');
const { handleAsyncErrors, sendSuccessResponse } = require('../middleware/errorHandler');

const getConversations = handleAsyncErrors(async (req, res) => {
  const conversations = await Message.getRecentConversations(req.user._id);
  sendSuccessResponse(res, conversations, 'Conversations retrieved successfully');
});

const getTradeMessages = handleAsyncErrors(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const messages = await Message.getConversation(req.params.tradeId, parseInt(page), parseInt(limit));
  sendSuccessResponse(res, messages, 'Messages retrieved successfully');
});

const getUnreadCount = handleAsyncErrors(async (req, res) => {
  const count = await Message.getUnreadCount(req.user._id);
  sendSuccessResponse(res, { count }, 'Unread count retrieved successfully');
});

const markAsRead = handleAsyncErrors(async (req, res) => {
  await Message.findByIdAndUpdate(req.params.id, { status: 'read', readAt: new Date() });
  sendSuccessResponse(res, null, 'Message marked as read');
});

module.exports = { getConversations, getTradeMessages, getUnreadCount, markAsRead };