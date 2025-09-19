const User = require('../models/User');
const Trade = require('../models/Trade');
const { handleAsyncErrors, sendSuccessResponse } = require('../middleware/errorHandler');

const getDashboard = handleAsyncErrors(async (req, res) => {
  const stats = {
    totalUsers: await User.countDocuments(),
    activeUsers: await User.countDocuments({ isActive: true }),
    totalTrades: await Trade.countDocuments(),
    completedTrades: await Trade.countDocuments({ status: 'completed' })
  };
  sendSuccessResponse(res, stats, 'Admin dashboard retrieved successfully');
});

const getUsers = handleAsyncErrors(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const users = await User.find()
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });
  sendSuccessResponse(res, users, 'Users retrieved successfully');
});

const updateUserStatus = handleAsyncErrors(async (req, res) => {
  const { isActive } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
  sendSuccessResponse(res, user, 'User status updated successfully');
});

const getTrades = handleAsyncErrors(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const trades = await Trade.find()
    .populate(['requester', 'provider'])
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });
  sendSuccessResponse(res, trades, 'Trades retrieved successfully');
});

const resolveTrade = handleAsyncErrors(async (req, res) => {
  const { resolution } = req.body;
  const trade = await Trade.findByIdAndUpdate(
    req.params.id, 
    { status: 'resolved', disputeResolvedBy: req.user._id, disputeResolvedAt: new Date() },
    { new: true }
  );
  sendSuccessResponse(res, trade, 'Trade resolved successfully');
});

const getAnalytics = handleAsyncErrors(async (req, res) => {
  const analytics = {
    userGrowth: [], // Implement time series data
    tradeVolume: [],
    popularSkills: []
  };
  sendSuccessResponse(res, analytics, 'Analytics retrieved successfully');
});

module.exports = { getDashboard, getUsers, updateUserStatus, getTrades, resolveTrade, getAnalytics };