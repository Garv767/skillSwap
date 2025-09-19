const Trade = require('../models/Trade');
const { handleAsyncErrors, sendSuccessResponse } = require('../middleware/errorHandler');

const getUserTrades = handleAsyncErrors(async (req, res) => {
  const trades = await Trade.findByUser(req.user._id);
  sendSuccessResponse(res, trades, 'User trades retrieved successfully');
});

const createTrade = handleAsyncErrors(async (req, res) => {
  const tradeData = { ...req.body, requester: req.user._id };
  const trade = await Trade.create(tradeData);
  await trade.populate(['requester', 'provider']);
  sendSuccessResponse(res, trade, 'Trade created successfully', 201);
});

const getTrade = handleAsyncErrors(async (req, res) => {
  const trade = await Trade.findById(req.params.id)
    .populate(['requester', 'provider']);
  sendSuccessResponse(res, trade, 'Trade retrieved successfully');
});

const updateTradeStatus = handleAsyncErrors(async (req, res) => {
  const { status } = req.body;
  const trade = await Trade.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  ).populate(['requester', 'provider']);
  sendSuccessResponse(res, trade, 'Trade status updated successfully');
});

const addReview = handleAsyncErrors(async (req, res) => {
  const { rating, comment } = req.body;
  const trade = await Trade.findById(req.params.id);
  
  // Add review based on user role
  if (trade.requester.toString() === req.user._id.toString()) {
    trade.reviews.requesterReview = { rating, comment, submittedAt: new Date() };
  } else {
    trade.reviews.providerReview = { rating, comment, submittedAt: new Date() };
  }
  
  await trade.save();
  sendSuccessResponse(res, trade.reviews, 'Review added successfully');
});

module.exports = { getUserTrades, createTrade, getTrade, updateTradeStatus, addReview };