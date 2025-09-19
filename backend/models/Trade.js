const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  // Trade Participants
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Requester is required']
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Provider is required']
  },

  // Skills Being Exchanged
  requestedSkill: {
    name: {
      type: String,
      required: [true, 'Requested skill name is required'],
      trim: true
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      required: [true, 'Requested skill level is required']
    },
    category: {
      type: String,
      required: [true, 'Requested skill category is required'],
      trim: true
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      required: [true, 'Skill description is required']
    },
    estimatedHours: {
      type: Number,
      required: [true, 'Estimated hours is required'],
      min: [0.5, 'Minimum 0.5 hours required'],
      max: [100, 'Maximum 100 hours allowed']
    }
  },

  offeredSkill: {
    name: {
      type: String,
      required: [true, 'Offered skill name is required'],
      trim: true
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      required: [true, 'Offered skill level is required']
    },
    category: {
      type: String,
      required: [true, 'Offered skill category is required'],
      trim: true
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      required: [true, 'Skill description is required']
    },
    estimatedHours: {
      type: Number,
      required: [true, 'Estimated hours is required'],
      min: [0.5, 'Minimum 0.5 hours required'],
      max: [100, 'Maximum 100 hours allowed']
    }
  },

  // Trade Details
  title: {
    type: String,
    required: [true, 'Trade title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Trade description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },

  // Trade Status
  status: {
    type: String,
    enum: [
      'pending',      // Initial state - waiting for provider response
      'negotiating',  // Both parties are discussing terms
      'accepted',     // Provider accepted the trade
      'in_progress',  // Trade is actively happening
      'completed',    // Both parties completed their obligations
      'cancelled',    // Trade was cancelled by either party
      'disputed'      // There's a dispute that needs resolution
    ],
    default: 'pending'
  },

  // Timeline
  timeline: {
    proposedAt: {
      type: Date,
      default: Date.now
    },
    acceptedAt: Date,
    startedAt: Date,
    completedAt: Date,
    cancelledAt: Date
  },

  // Meeting Preferences
  meetingPreferences: {
    type: {
      type: String,
      enum: ['Virtual', 'In-person', 'Both'],
      required: [true, 'Meeting type is required'],
      default: 'Virtual'
    },
    location: {
      type: String,
      trim: true
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    preferredDays: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    preferredTimes: [{
      startTime: String,
      endTime: String
    }]
  },

  // Progress Tracking
  progress: {
    requesterProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    providerProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    milestones: [{
      title: {
        type: String,
        required: true,
        trim: true
      },
      description: String,
      dueDate: Date,
      completed: {
        type: Boolean,
        default: false
      },
      completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      completedAt: Date
    }]
  },

  // Communication
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  messageCount: {
    type: Number,
    default: 0
  },

  // Reviews and Ratings (populated after completion)
  reviews: {
    requesterReview: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: {
        type: String,
        maxlength: 500
      },
      submittedAt: Date
    },
    providerReview: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: {
        type: String,
        maxlength: 500
      },
      submittedAt: Date
    }
  },

  // Additional Information
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],

  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },

  // Cancellation/Dispute Information
  cancellationReason: {
    type: String,
    trim: true
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  disputeReason: {
    type: String,
    trim: true
  },
  disputeDetails: {
    type: String,
    trim: true
  },
  disputeResolvedAt: Date,
  disputeResolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // System Fields
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: Date,

  // Metadata
  metadata: {
    ipAddress: String,
    userAgent: String,
    referrer: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
tradeSchema.index({ requester: 1, status: 1 });
tradeSchema.index({ provider: 1, status: 1 });
tradeSchema.index({ status: 1, createdAt: -1 });
tradeSchema.index({ 'requestedSkill.category': 1, 'offeredSkill.category': 1 });
tradeSchema.index({ tags: 1 });

// Text search index
tradeSchema.index({
  title: 'text',
  description: 'text',
  'requestedSkill.name': 'text',
  'offeredSkill.name': 'text',
  tags: 'text'
});

// Virtual for trade duration
tradeSchema.virtual('duration').get(function() {
  if (this.timeline.completedAt && this.timeline.startedAt) {
    return Math.ceil((this.timeline.completedAt - this.timeline.startedAt) / (1000 * 60 * 60 * 24)); // Days
  }
  return null;
});

// Virtual for overall progress
tradeSchema.virtual('overallProgress').get(function() {
  return Math.round((this.progress.requesterProgress + this.progress.providerProgress) / 2);
});

// Virtual for trade participants
tradeSchema.virtual('participants').get(function() {
  return [this.requester, this.provider];
});

// Pre-save middleware
tradeSchema.pre('save', function(next) {
  // Update lastMessageAt when message count changes
  if (this.isModified('messageCount') && this.messageCount > 0) {
    this.lastMessageAt = new Date();
  }

  // Set timeline dates based on status changes
  if (this.isModified('status')) {
    const now = new Date();
    switch (this.status) {
      case 'accepted':
        if (!this.timeline.acceptedAt) this.timeline.acceptedAt = now;
        break;
      case 'in_progress':
        if (!this.timeline.startedAt) this.timeline.startedAt = now;
        break;
      case 'completed':
        if (!this.timeline.completedAt) this.timeline.completedAt = now;
        break;
      case 'cancelled':
        if (!this.timeline.cancelledAt) this.timeline.cancelledAt = now;
        break;
    }
  }

  next();
});

// Static methods
tradeSchema.statics.findByUser = function(userId, status = null) {
  let query = {
    $or: [
      { requester: userId },
      { provider: userId }
    ],
    isArchived: false
  };

  if (status) {
    query.status = status;
  }

  return this.find(query)
    .populate('requester', 'firstName lastName avatar rating')
    .populate('provider', 'firstName lastName avatar rating')
    .sort({ createdAt: -1 });
};

tradeSchema.statics.findActiveByUser = function(userId) {
  return this.findByUser(userId, 'in_progress');
};

tradeSchema.statics.getTradeStats = function(userId) {
  return this.aggregate([
    {
      $match: {
        $or: [
          { requester: mongoose.Types.ObjectId(userId) },
          { provider: mongoose.Types.ObjectId(userId) }
        ]
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

// Instance methods
tradeSchema.methods.canBeEditedBy = function(userId) {
  return (this.requester.toString() === userId.toString() || 
          this.provider.toString() === userId.toString()) &&
         ['pending', 'negotiating'].includes(this.status);
};

tradeSchema.methods.canBeCancelledBy = function(userId) {
  return (this.requester.toString() === userId.toString() || 
          this.provider.toString() === userId.toString()) &&
         !['completed', 'cancelled', 'disputed'].includes(this.status);
};

tradeSchema.methods.isParticipant = function(userId) {
  return this.requester.toString() === userId.toString() || 
         this.provider.toString() === userId.toString();
};

tradeSchema.methods.getOtherParticipant = function(userId) {
  if (this.requester.toString() === userId.toString()) {
    return this.provider;
  } else if (this.provider.toString() === userId.toString()) {
    return this.requester;
  }
  return null;
};

tradeSchema.methods.updateProgress = function(userId, progress) {
  if (this.requester.toString() === userId.toString()) {
    this.progress.requesterProgress = Math.max(0, Math.min(100, progress));
  } else if (this.provider.toString() === userId.toString()) {
    this.progress.providerProgress = Math.max(0, Math.min(100, progress));
  }

  // Auto-complete if both parties are at 100%
  if (this.progress.requesterProgress === 100 && this.progress.providerProgress === 100) {
    this.status = 'completed';
  }
};

tradeSchema.methods.addMilestone = function(milestone) {
  this.progress.milestones.push({
    title: milestone.title,
    description: milestone.description || '',
    dueDate: milestone.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default: 1 week
    completed: false
  });
};

tradeSchema.methods.completeMilestone = function(milestoneId, userId) {
  const milestone = this.progress.milestones.id(milestoneId);
  if (milestone && this.isParticipant(userId)) {
    milestone.completed = true;
    milestone.completedBy = userId;
    milestone.completedAt = new Date();
  }
  return milestone;
};

module.exports = mongoose.model('Trade', tradeSchema);