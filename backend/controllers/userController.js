const User = require('../models/User');
const { handleAsyncErrors, sendSuccessResponse, BadRequestError, NotFoundError } = require('../middleware/errorHandler');

const searchUsers = handleAsyncErrors(async (req, res) => {
  const { keyword, skills, location, rating, page = 1, limit = 20 } = req.query;
  
  const users = await User.advancedSearch({
    keyword,
    skills: skills ? skills.split(',') : [],
    location,
    rating: rating ? parseFloat(rating) : null,
    page: parseInt(page),
    limit: parseInt(limit)
  });

  sendSuccessResponse(res, users, 'Users retrieved successfully');
});

const getUserProfile = handleAsyncErrors(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new NotFoundError('User not found');
  
  sendSuccessResponse(res, user, 'User profile retrieved successfully');
});

const updateProfile = handleAsyncErrors(async (req, res) => {
  const updates = req.body;
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  
  sendSuccessResponse(res, user, 'Profile updated successfully');
});

const addSkills = handleAsyncErrors(async (req, res) => {
  const { skills } = req.body;
  const user = await User.findById(req.user._id);
  
  skills.forEach(skill => user.skills.push(skill));
  await user.save();
  
  sendSuccessResponse(res, user.skills, 'Skills added successfully');
});

const removeSkill = handleAsyncErrors(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.skills.id(req.params.skillId).remove();
  await user.save();
  
  sendSuccessResponse(res, user.skills, 'Skill removed successfully');
});

const getDashboard = handleAsyncErrors(async (req, res) => {
  // Dashboard data implementation
  const dashboardData = {
    user: req.user,
    stats: {
      totalTrades: 0,
      completedTrades: 0,
      rating: 0
    }
  };
  
  sendSuccessResponse(res, dashboardData, 'Dashboard data retrieved');
});

module.exports = {
  searchUsers,
  getUserProfile,
  updateProfile,
  addSkills,
  removeSkill,
  getDashboard
};