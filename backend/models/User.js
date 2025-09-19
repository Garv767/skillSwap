const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  
  // Profile Information
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    trim: true
  },
  avatar: {
    type: String, // URL to profile image
    default: null
  },
  location: {
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true }
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  
  // Skills and Expertise
  skills: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      required: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      maxlength: 200
    },
    verified: {
      type: Boolean,
      default: false
    }
  }],
  
  // Seeking Skills
  seekingSkills: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      required: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      maxlength: 200
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium'
    }
  }],
  
  // Availability
  availability: {
    hoursPerWeek: {
      type: Number,
      min: 0,
      max: 168, // Total hours in a week
      default: 5
    },
    schedule: {
      monday: { available: Boolean, startTime: String, endTime: String },
      tuesday: { available: Boolean, startTime: String, endTime: String },
      wednesday: { available: Boolean, startTime: String, endTime: String },
      thursday: { available: Boolean, startTime: String, endTime: String },
      friday: { available: Boolean, startTime: String, endTime: String },
      saturday: { available: Boolean, startTime: String, endTime: String },
      sunday: { available: Boolean, startTime: String, endTime: String }
    },
    preferredMeetingType: {
      type: String,
      enum: ['Virtual', 'In-person', 'Both'],
      default: 'Both'
    }
  },
  
  // Rating and Reviews
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    }
  },
  
  // Statistics
  stats: {
    totalTrades: {
      type: Number,
      default: 0
    },
    completedTrades: {
      type: Number,
      default: 0
    },
    successRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    responseTime: {
      type: Number, // Average response time in hours
      default: 24
    }
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  
  // Social Links
  socialLinks: {
    linkedin: { type: String, trim: true },
    github: { type: String, trim: true },
    portfolio: { type: String, trim: true },
    twitter: { type: String, trim: true }
  },
  
  // Preferences
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    pushNotifications: {
      type: Boolean,
      default: true
    },
    profileVisibility: {
      type: String,
      enum: ['Public', 'Private', 'Limited'],
      default: 'Public'
    },
    showLocation: {
      type: Boolean,
      default: true
    }
  },
  
  // Account Management
  lastLogin: {
    type: Date,
    default: Date.now
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  emailVerificationToken: String,
  emailVerificationExpires: Date
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Index for text search
userSchema.index({ 
  firstName: 'text', 
  lastName: 'text', 
  bio: 'text',
  'skills.name': 'text',
  'skills.category': 'text'
});

// Index for location-based searches
userSchema.index({ 'location.city': 1, 'location.country': 1 });

// Index for skill searches
userSchema.index({ 'skills.name': 1, 'skills.category': 1, 'skills.level': 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Method to update rating
userSchema.methods.updateRating = function(newRating) {
  const totalRating = (this.rating.average * this.rating.totalReviews) + newRating;
  this.rating.totalReviews += 1;
  this.rating.average = totalRating / this.rating.totalReviews;
  this.rating.average = Math.round(this.rating.average * 10) / 10; // Round to 1 decimal place
};

// Method to update success rate
userSchema.methods.updateSuccessRate = function() {
  if (this.stats.totalTrades > 0) {
    this.stats.successRate = Math.round((this.stats.completedTrades / this.stats.totalTrades) * 100);
  }
};

// Static method to find users by skill
userSchema.statics.findBySkill = function(skillName, skillLevel = null) {
  const query = { 'skills.name': new RegExp(skillName, 'i') };
  if (skillLevel) {
    query['skills.level'] = skillLevel;
  }
  return this.find(query);
};

// Static method for advanced search
userSchema.statics.advancedSearch = function(searchCriteria) {
  const {
    keyword,
    skills,
    location,
    availability,
    rating,
    page = 1,
    limit = 10
  } = searchCriteria;

  let query = { isActive: true };

  // Text search
  if (keyword) {
    query.$text = { $search: keyword };
  }

  // Skills filter
  if (skills && skills.length > 0) {
    query['skills.name'] = { $in: skills.map(skill => new RegExp(skill, 'i')) };
  }

  // Location filter
  if (location) {
    if (location.city) query['location.city'] = new RegExp(location.city, 'i');
    if (location.country) query['location.country'] = new RegExp(location.country, 'i');
  }

  // Rating filter
  if (rating) {
    query['rating.average'] = { $gte: rating };
  }

  const skip = (page - 1) * limit;

  return this.find(query)
    .select('-password')
    .sort({ 'rating.average': -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

module.exports = mongoose.model('User', userSchema);