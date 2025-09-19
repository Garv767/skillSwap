const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        // Get token from header
        token = req.headers.authorization.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from token
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: 'User not found'
          });
        }

        if (!req.user.isActive) {
          return res.status(401).json({
            success: false,
            message: 'User account is inactive'
          });
        }

        // Update last login
        req.user.lastLogin = new Date();
        await req.user.save({ validateBeforeSave: false });

        next();
      } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this resource`
      });
    }

    next();
  };
};

const optional = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];

      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          req.user = await User.findById(decoded.id).select('-password');
          
          if (req.user && req.user.isActive) {
            req.user.lastLogin = new Date();
            await req.user.save({ validateBeforeSave: false });
          }
        } catch (error) {
          console.error('Optional auth error:', error);
          // Don't throw error for optional auth
          req.user = null;
        }
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    req.user = null;
    next();
  }
};

// Middleware to check if user owns resource
const checkResourceOwnership = (resourceName, userField = 'user') => {
  return async (req, res, next) => {
    try {
      const Model = require(`../models/${resourceName}`);
      const resource = await Model.findById(req.params.id);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: `${resourceName} not found`
        });
      }

      // Check ownership
      const resourceUserId = resource[userField]?.toString();
      const currentUserId = req.user._id.toString();

      if (resourceUserId !== currentUserId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this resource'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error('Resource ownership check error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error checking resource ownership'
      });
    }
  };
};

// Middleware to check if user is participant in trade
const checkTradeParticipation = async (req, res, next) => {
  try {
    const Trade = require('../models/Trade');
    const trade = await Trade.findById(req.params.tradeId || req.params.id);

    if (!trade) {
      return res.status(404).json({
        success: false,
        message: 'Trade not found'
      });
    }

    const userId = req.user._id.toString();
    const isParticipant = trade.requester.toString() === userId || 
                         trade.provider.toString() === userId;

    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this trade'
      });
    }

    req.trade = trade;
    next();
  } catch (error) {
    console.error('Trade participation check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking trade participation'
    });
  }
};

// Rate limiting middleware for sensitive operations
const rateLimitAuth = (windowMs = 15 * 60 * 1000, max = 5) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = req.ip + (req.body.email || '');
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old attempts
    const userAttempts = attempts.get(key) || [];
    const recentAttempts = userAttempts.filter(time => time > windowStart);

    if (recentAttempts.length >= max) {
      return res.status(429).json({
        success: false,
        message: 'Too many attempts. Please try again later.',
        retryAfter: Math.ceil((recentAttempts[0] + windowMs - now) / 1000)
      });
    }

    // Record this attempt
    recentAttempts.push(now);
    attempts.set(key, recentAttempts);

    next();
  };
};

module.exports = {
  protect,
  authorize,
  optional,
  checkResourceOwnership,
  checkTradeParticipation,
  rateLimitAuth
};