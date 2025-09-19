const express = require('express');
const { body, param, query } = require('express-validator');
const { protect, optional } = require('../middleware/auth');
const userController = require('../controllers/userController');

const router = express.Router();

// @route   GET /api/users/search
// @desc    Search users by skills, location, etc.
// @access  Public
router.get('/search', optional, userController.searchUsers);

// @route   GET /api/users/:id
// @desc    Get user profile by ID
// @access  Public
router.get('/:id', 
  param('id').isMongoId().withMessage('Invalid user ID'),
  optional,
  userController.getUserProfile
);

// Protected routes
router.use(protect);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  body('firstName').optional().trim().isLength({min: 2, max: 50}),
  body('lastName').optional().trim().isLength({min: 2, max: 50}),
  body('bio').optional().trim().isLength({max: 500}),
  body('location.city').optional().trim().isLength({max: 100}),
  body('location.country').optional().trim().isLength({max: 100})
], userController.updateProfile);

// @route   POST /api/users/skills
// @desc    Add skills to user profile
// @access  Private
router.post('/skills', [
  body('skills').isArray({min: 1}).withMessage('At least one skill is required'),
  body('skills.*.name').notEmpty().withMessage('Skill name is required'),
  body('skills.*.level').isIn(['Beginner', 'Intermediate', 'Advanced', 'Expert']).withMessage('Invalid skill level'),
  body('skills.*.category').notEmpty().withMessage('Skill category is required')
], userController.addSkills);

// @route   DELETE /api/users/skills/:skillId
// @desc    Remove skill from user profile
// @access  Private
router.delete('/skills/:skillId', 
  param('skillId').isMongoId().withMessage('Invalid skill ID'),
  userController.removeSkill
);

// @route   GET /api/users/me/dashboard
// @desc    Get user dashboard data
// @access  Private
router.get('/me/dashboard', userController.getDashboard);

module.exports = router;