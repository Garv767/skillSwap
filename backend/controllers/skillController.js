const Skill = require('../models/Skill');
const { handleAsyncErrors, sendSuccessResponse } = require('../middleware/errorHandler');

const getSkills = handleAsyncErrors(async (req, res) => {
  const skills = await Skill.find({ isActive: true }).limit(50);
  sendSuccessResponse(res, skills, 'Skills retrieved successfully');
});

const getCategories = handleAsyncErrors(async (req, res) => {
  const categories = await Skill.getCategories();
  sendSuccessResponse(res, categories, 'Categories retrieved successfully');
});

const getPopularSkills = handleAsyncErrors(async (req, res) => {
  const skills = await Skill.findPopular(20);
  sendSuccessResponse(res, skills, 'Popular skills retrieved successfully');
});

const getTrendingSkills = handleAsyncErrors(async (req, res) => {
  const skills = await Skill.getTrending(30);
  sendSuccessResponse(res, skills, 'Trending skills retrieved successfully');
});

const getSkill = handleAsyncErrors(async (req, res) => {
  const skill = await Skill.findById(req.params.id);
  sendSuccessResponse(res, skill, 'Skill retrieved successfully');
});

module.exports = { getSkills, getCategories, getPopularSkills, getTrendingSkills, getSkill };