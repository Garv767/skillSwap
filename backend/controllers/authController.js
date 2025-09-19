const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { 
  BadRequestError, 
  UnauthorizedError, 
  NotFoundError,
  sendSuccessResponse,
  sendErrorResponse,
  handleAsyncErrors 
} = require('../middleware/errorHandler');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Generate refresh token
const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = handleAsyncErrors(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new BadRequestError('Validation failed', errors.array());
  }

  const {
    firstName,
    lastName,
    email,
    password,
    bio,
    location,
    skills = [],
    seekingSkills = []
  } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new BadRequestError('User already exists with this email address');
  }

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    bio,
    location,
    skills,
    seekingSkills
  });

  // Generate token
  const token = generateToken(user._id);

  // Remove password from response
  user.password = undefined;

  sendSuccessResponse(res, {
    token,
    user: user.toObject()
  }, 'User registered successfully', 201);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = handleAsyncErrors(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new BadRequestError('Validation failed', errors.array());
  }

  const { email, password } = req.body;

  // Find user and include password for comparison
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Check if account is active
  if (!user.isActive) {
    throw new UnauthorizedError('Account is deactivated. Please contact support.');
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Generate token
  const token = generateToken(user._id);

  // Remove password from response
  user.password = undefined;

  sendSuccessResponse(res, {
    token,
    user: user.toObject()
  }, 'Login successful');
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = handleAsyncErrors(async (req, res) => {
  // In a more complete implementation, you would invalidate the token
  // For now, we'll just return a success message
  sendSuccessResponse(res, null, 'Logged out successfully');
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = handleAsyncErrors(async (req, res) => {
  if (!req.user) {
    throw new UnauthorizedError('Not authorized');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  sendSuccessResponse(res, user, 'User profile retrieved successfully');
});

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = handleAsyncErrors(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new BadRequestError('Refresh token is required');
  }

  // In a complete implementation, you would verify the refresh token
  // For now, we'll just generate a new access token
  // This is a simplified version - in production, implement proper refresh token logic
  
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const newToken = generateToken(user._id);

    sendSuccessResponse(res, {
      token: newToken
    }, 'Token refreshed successfully');
  } catch (error) {
    throw new UnauthorizedError('Invalid refresh token');
  }
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = handleAsyncErrors(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new BadRequestError('Validation failed', errors.array());
  }

  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if user exists or not for security
    sendSuccessResponse(res, null, 'If a user with that email exists, a password reset link has been sent');
    return;
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Set expire time (10 minutes)
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  // In a complete implementation, send email here
  console.log('Password reset URL:', resetUrl);

  sendSuccessResponse(res, null, 'Password reset link sent to your email');
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = handleAsyncErrors(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new BadRequestError('Validation failed', errors.array());
  }

  const { token, password } = req.body;

  // Get hashed token
  const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: resetPasswordToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw new BadRequestError('Invalid or expired reset token');
  }

  // Set new password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  // Generate new token
  const newToken = generateToken(user._id);

  sendSuccessResponse(res, {
    token: newToken
  }, 'Password reset successful');
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = handleAsyncErrors(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new BadRequestError('Validation failed', errors.array());
  }

  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Check current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new BadRequestError('Current password is incorrect');
  }

  // Set new password
  user.password = newPassword;
  await user.save();

  sendSuccessResponse(res, null, 'Password changed successfully');
});

// @desc    Verify email
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = handleAsyncErrors(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new BadRequestError('Verification token is required');
  }

  // Hash token
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw new BadRequestError('Invalid or expired verification token');
  }

  // Update user
  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;

  await user.save({ validateBeforeSave: false });

  sendSuccessResponse(res, null, 'Email verified successfully');
});

// @desc    Resend email verification
// @route   POST /api/auth/resend-verification
// @access  Private
const resendVerification = handleAsyncErrors(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user.isVerified) {
    throw new BadRequestError('Email is already verified');
  }

  // Generate verification token
  const verificationToken = crypto.randomBytes(20).toString('hex');

  // Hash and set token
  user.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
  user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  await user.save({ validateBeforeSave: false });

  // Create verification URL
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

  // In a complete implementation, send email here
  console.log('Email verification URL:', verifyUrl);

  sendSuccessResponse(res, null, 'Verification email sent');
});

// @desc    Delete user account
// @route   DELETE /api/auth/delete-account
// @access  Private
const deleteAccount = handleAsyncErrors(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new BadRequestError('Validation failed', errors.array());
  }

  const { password } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new BadRequestError('Password is incorrect');
  }

  // Instead of deleting, deactivate the account
  user.isActive = false;
  await user.save({ validateBeforeSave: false });

  sendSuccessResponse(res, null, 'Account deactivated successfully');
});

exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields required' });
  }
  // TODO: Add user creation logic here
  return res.status(201).json({ success: true, message: 'User registered successfully' });
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password required' });
  }
  // TODO: Add authentication logic here
  return res.status(200).json({ success: true, message: 'Login successful' });
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
  resendVerification,
  deleteAccount
};