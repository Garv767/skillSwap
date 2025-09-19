const express = require('express');
const { protect, optional } = require('../middleware/auth');
const skillController = require('../controllers/skillController');

const router = express.Router();

// @route   GET /api/skills
// @desc    Get all skills with search and filter
// @access  Public
router.get('/', optional, skillController.getSkills);

// @route   GET /api/skills/categories
// @desc    Get skill categories
// @access  Public
router.get('/categories', skillController.getCategories);

// @route   GET /api/skills/popular
// @desc    Get popular skills
// @access  Public
router.get('/popular', skillController.getPopularSkills);

// @route   GET /api/skills/trending
// @desc    Get trending skills
// @access  Public
router.get('/trending', skillController.getTrendingSkills);

// @route   GET /api/skills/:id
// @desc    Get single skill
// @access  Public
router.get('/:id', skillController.getSkill);

module.exports = router;