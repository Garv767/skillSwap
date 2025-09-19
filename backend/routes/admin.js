const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

const router = express.Router();

// All routes are protected and require admin role
router.use(protect);
router.use(authorize('admin'));

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private/Admin
router.get('/dashboard', adminController.getDashboard);

// @route   GET /api/admin/users
// @desc    Get all users with pagination
// @access  Private/Admin
router.get('/users', adminController.getUsers);

// @route   PUT /api/admin/users/:id/status
// @desc    Update user status (activate/deactivate)
// @access  Private/Admin
router.put('/users/:id/status', adminController.updateUserStatus);

// @route   GET /api/admin/trades
// @desc    Get all trades with pagination
// @access  Private/Admin
router.get('/trades', adminController.getTrades);

// @route   PUT /api/admin/trades/:id/resolve
// @desc    Resolve disputed trade
// @access  Private/Admin
router.put('/trades/:id/resolve', adminController.resolveTrade);

// @route   GET /api/admin/analytics
// @desc    Get platform analytics
// @access  Private/Admin
router.get('/analytics', adminController.getAnalytics);

module.exports = router;