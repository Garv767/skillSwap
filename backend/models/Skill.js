const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Skill name is required'],
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: [100, 'Skill name cannot exceed 100 characters']
  },
  displayName: {
    type: String,
    required: [true, 'Display name is required'],
    trim: true,
    maxlength: [100, 'Display name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Skill description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },

  // Categorization
  category: {
    type: String,
    required: [true, 'Skill category is required'],
    trim: true,
    lowercase: true,
    enum: [
      'technology',
      'design',
      'business',
      'marketing',
      'writing',
      'education',
      'healthcare',
      'arts',
      'music',
      'sports',
      'cooking',
      'languages',
      'crafts',
      'photography',
      'video',
      'finance',
      'legal',
      'consulting',
      'other'
    ]
  },
  subcategory: {
    type: String,
    trim: true,
    lowercase: true
  },

  // Skill Metadata
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  keywords: [{
    type: String,
    trim: true,
    lowercase: true
  }],

  // Difficulty and Learning
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    default: 'Beginner'
  },
  estimatedLearningTime: {
    type: Number, // in hours
    min: 1,
    max: 10000
  },
  prerequisites: [{
    skill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill'
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert']
    }
  }],

  // Statistics
  stats: {
    totalUsers: {
      type: Number,
      default: 0
    },
    totalOffers: {
      type: Number,
      default: 0
    },
    totalRequests: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalTrades: {
      type: Number,
      default: 0
    }
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },

  // Icon and Visual
  icon: {
    type: String, // URL or icon name
    default: null
  },
  color: {
    type: String, // Hex color code
    default: '#4F46E5'
  },

  // Related Skills
  relatedSkills: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill'
  }],
  complementarySkills: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill'
  }],

  // Learning Resources (optional)
  resources: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['article', 'video', 'course', 'book', 'tutorial', 'documentation'],
      required: true
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Admin Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,

  // Metadata
  searchCount: {
    type: Number,
    default: 0
  },
  lastSearched: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
skillSchema.index({ name: 1 });
skillSchema.index({ category: 1, subcategory: 1 });
skillSchema.index({ tags: 1 });
skillSchema.index({ isActive: 1, isVerified: 1 });
skillSchema.index({ isFeatured: 1, 'stats.totalUsers': -1 });

// Text search index
skillSchema.index({
  name: 'text',
  displayName: 'text',
  description: 'text',
  tags: 'text',
  keywords: 'text'
});

// Compound indexes for efficient queries
skillSchema.index({ category: 1, 'stats.totalUsers': -1 });
skillSchema.index({ difficulty: 1, category: 1 });

// Virtual for popularity score
skillSchema.virtual('popularityScore').get(function() {
  const userWeight = 0.4;
  const tradeWeight = 0.3;
  const ratingWeight = 0.2;
  const searchWeight = 0.1;

  return (
    (this.stats.totalUsers * userWeight) +
    (this.stats.totalTrades * tradeWeight) +
    (this.stats.averageRating * ratingWeight) +
    (this.searchCount * searchWeight)
  );
});

// Virtual for demand ratio
skillSchema.virtual('demandRatio').get(function() {
  if (this.stats.totalOffers === 0) return Infinity;
  return this.stats.totalRequests / this.stats.totalOffers;
});

// Virtual for skill level distribution
skillSchema.virtual('levelDistribution', {
  ref: 'User',
  localField: '_id',
  foreignField: 'skills.skill',
  justOne: false
});

// Pre-save middleware
skillSchema.pre('save', function(next) {
  // Generate keywords from name and description
  if (this.isModified('name') || this.isModified('description')) {
    const words = [...this.name.split(/\s+/), ...this.description.split(/\s+/)];
    this.keywords = [...new Set(words.filter(word => word.length > 2))];
  }

  // Set display name if not provided
  if (!this.displayName) {
    this.displayName = this.name.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  next();
});

// Static methods
skillSchema.statics.findPopular = function(limit = 20) {
  return this.find({ isActive: true })
    .sort({ 'stats.totalUsers': -1, 'stats.totalTrades': -1 })
    .limit(limit);
};

skillSchema.statics.findFeatured = function() {
  return this.find({ isFeatured: true, isActive: true })
    .sort({ 'stats.totalUsers': -1 });
};

skillSchema.statics.findByCategory = function(category, limit = 50) {
  return this.find({ 
    category: category.toLowerCase(),
    isActive: true 
  })
  .sort({ 'stats.totalUsers': -1 })
  .limit(limit);
};

skillSchema.statics.searchSkills = function(searchTerm, filters = {}) {
  const {
    category,
    difficulty,
    minUsers = 0,
    page = 1,
    limit = 20
  } = filters;

  let query = {
    isActive: true,
    'stats.totalUsers': { $gte: minUsers }
  };

  // Text search
  if (searchTerm) {
    query.$text = { $search: searchTerm };
  }

  // Category filter
  if (category && category !== 'all') {
    query.category = category.toLowerCase();
  }

  // Difficulty filter
  if (difficulty && difficulty !== 'all') {
    query.difficulty = difficulty;
  }

  const skip = (page - 1) * limit;

  let sortCriteria = {};
  if (searchTerm) {
    sortCriteria = { score: { $meta: 'textScore' } };
  } else {
    sortCriteria = { 'stats.totalUsers': -1, 'stats.totalTrades': -1 };
  }

  return this.find(query, searchTerm ? { score: { $meta: 'textScore' } } : {})
    .sort(sortCriteria)
    .skip(skip)
    .limit(limit);
};

skillSchema.statics.getCategories = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalUsers: { $sum: '$stats.totalUsers' },
        skills: { $push: '$$ROOT' }
      }
    },
    { $sort: { totalUsers: -1 } }
  ]);
};

skillSchema.statics.getTrending = function(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.find({
    isActive: true,
    lastSearched: { $gte: since }
  })
  .sort({ searchCount: -1, 'stats.totalTrades': -1 })
  .limit(20);
};

skillSchema.statics.getSuggestions = function(userSkills = [], limit = 10) {
  const userSkillIds = userSkills.map(skill => skill._id || skill);
  
  return this.find({
    isActive: true,
    _id: { $nin: userSkillIds }
  })
  .populate('relatedSkills complementarySkills')
  .sort({ 'stats.totalUsers': -1 })
  .limit(limit);
};

// Instance methods
skillSchema.methods.incrementSearchCount = function() {
  this.searchCount += 1;
  this.lastSearched = new Date();
  return this.save();
};

skillSchema.methods.updateStats = function(statType, increment = 1) {
  if (this.stats[statType] !== undefined) {
    this.stats[statType] += increment;
  }
};

skillSchema.methods.calculateAverageRating = async function() {
  const User = mongoose.model('User');
  const users = await User.find({
    'skills.name': this.name,
    'skills.rating': { $exists: true }
  });

  if (users.length === 0) return 0;

  const totalRating = users.reduce((sum, user) => {
    const skill = user.skills.find(s => s.name === this.name);
    return sum + (skill?.rating || 0);
  }, 0);

  this.stats.averageRating = Math.round((totalRating / users.length) * 10) / 10;
  return this.stats.averageRating;
};

skillSchema.methods.findSimilar = function(limit = 5) {
  return this.constructor.find({
    _id: { $ne: this._id },
    $or: [
      { category: this.category },
      { tags: { $in: this.tags } },
      { keywords: { $in: this.keywords } }
    ],
    isActive: true
  })
  .sort({ 'stats.totalUsers': -1 })
  .limit(limit);
};

skillSchema.methods.addResource = function(resource) {
  this.resources.push(resource);
  return this.save();
};

skillSchema.methods.removeResource = function(resourceId) {
  this.resources = this.resources.filter(
    r => r._id.toString() !== resourceId.toString()
  );
  return this.save();
};

module.exports = mongoose.model('Skill', skillSchema);