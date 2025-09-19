const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Message Participants
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required']
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required']
  },

  // Related Trade
  trade: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trade',
    required: [true, 'Trade reference is required']
  },

  // Message Content
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },

  // Message Type
  messageType: {
    type: String,
    enum: [
      'text',           // Regular text message
      'system',         // System-generated message (e.g., "Trade accepted")
      'proposal',       // Trade proposal/counter-offer
      'meeting_request', // Meeting scheduling request
      'file',           // File attachment
      'milestone',      // Milestone update
      'completion'      // Trade completion notification
    ],
    default: 'text'
  },

  // Message Status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },

  // Timestamps
  readAt: {
    type: Date,
    default: null
  },
  deliveredAt: {
    type: Date,
    default: null
  },

  // Attachments (if any)
  attachments: [{
    fileName: {
      type: String,
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    }
  }],

  // System Message Data (for system messages)
  systemData: {
    action: String,        // e.g., 'trade_accepted', 'milestone_completed'
    previousValue: String, // Previous state for comparison
    newValue: String,      // New state
    metadata: mongoose.Schema.Types.Mixed // Additional data
  },

  // Message Threading (for replies)
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },

  // Message Reactions
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reaction: {
      type: String,
      enum: ['👍', '👎', '❤️', '😂', '😮', '😢', '😡'],
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Message Priority
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },

  // Soft Delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // Message Editing
  isEdited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    content: String,
    editedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Metadata
  metadata: {
    ipAddress: String,
    userAgent: String,
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number] // [longitude, latitude]
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ trade: 1, createdAt: -1 });
messageSchema.index({ status: 1 });
messageSchema.index({ messageType: 1 });
messageSchema.index({ createdAt: -1 });

// Compound index for conversation queries
messageSchema.index({ 
  trade: 1, 
  createdAt: -1,
  isDeleted: 1
});

// Text search index
messageSchema.index({ content: 'text' });

// Geospatial index for location-based features
messageSchema.index({ 'metadata.location': '2dsphere' });

// Virtual for message age
messageSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Virtual for conversation participants
messageSchema.virtual('participants').get(function() {
  return [this.sender, this.recipient];
});

// Virtual for reply count (if this is a parent message)
messageSchema.virtual('replyCount', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'replyTo',
  count: true
});

// Pre-save middleware
messageSchema.pre('save', function(next) {
  // Set delivered timestamp if status changes to delivered
  if (this.isModified('status')) {
    const now = new Date();
    if (this.status === 'delivered' && !this.deliveredAt) {
      this.deliveredAt = now;
    } else if (this.status === 'read' && !this.readAt) {
      this.readAt = now;
      // Also set delivered if not already set
      if (!this.deliveredAt) {
        this.deliveredAt = now;
      }
    }
  }

  // Handle message editing
  if (this.isModified('content') && !this.isNew) {
    // Store original content in edit history
    const originalContent = this._original?.content;
    if (originalContent && originalContent !== this.content) {
      this.editHistory.push({
        content: originalContent,
        editedAt: new Date()
      });
      this.isEdited = true;
    }
  }

  next();
});

// Post-init middleware to store original values for edit tracking
messageSchema.post('init', function() {
  this._original = this.toObject();
});

// Static methods
messageSchema.statics.getConversation = function(tradeId, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  return this.find({
    trade: tradeId,
    isDeleted: false
  })
  .populate('sender', 'firstName lastName avatar')
  .populate('recipient', 'firstName lastName avatar')
  .populate('replyTo', 'content sender createdAt')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);
};

messageSchema.statics.getUnreadCount = function(userId, tradeId = null) {
  const query = {
    recipient: userId,
    status: { $ne: 'read' },
    isDeleted: false
  };

  if (tradeId) {
    query.trade = tradeId;
  }

  return this.countDocuments(query);
};

messageSchema.statics.markAsRead = function(tradeId, userId) {
  return this.updateMany({
    trade: tradeId,
    recipient: userId,
    status: { $ne: 'read' }
  }, {
    status: 'read',
    readAt: new Date()
  });
};

messageSchema.statics.getRecentConversations = function(userId, limit = 10) {
  return this.aggregate([
    {
      $match: {
        $or: [
          { sender: mongoose.Types.ObjectId(userId) },
          { recipient: mongoose.Types.ObjectId(userId) }
        ],
        isDeleted: false
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: '$trade',
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$recipient', mongoose.Types.ObjectId(userId)] },
                  { $ne: ['$status', 'read'] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $lookup: {
        from: 'trades',
        localField: '_id',
        foreignField: '_id',
        as: 'trade'
      }
    },
    {
      $unwind: '$trade'
    },
    {
      $lookup: {
        from: 'users',
        localField: 'lastMessage.sender',
        foreignField: '_id',
        as: 'lastMessage.sender'
      }
    },
    {
      $unwind: '$lastMessage.sender'
    },
    {
      $sort: { 'lastMessage.createdAt': -1 }
    },
    {
      $limit: limit
    }
  ]);
};

// Instance methods
messageSchema.methods.canBeEditedBy = function(userId) {
  return this.sender.toString() === userId.toString() && 
         this.messageType === 'text' &&
         !this.isDeleted &&
         (Date.now() - this.createdAt.getTime()) < (15 * 60 * 1000); // 15 minutes
};

messageSchema.methods.canBeDeletedBy = function(userId) {
  return this.sender.toString() === userId.toString() && !this.isDeleted;
};

messageSchema.methods.addReaction = function(userId, reaction) {
  // Remove existing reaction by this user
  this.reactions = this.reactions.filter(
    r => r.user.toString() !== userId.toString()
  );
  
  // Add new reaction
  this.reactions.push({
    user: userId,
    reaction: reaction,
    createdAt: new Date()
  });
};

messageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(
    r => r.user.toString() !== userId.toString()
  );
};

messageSchema.methods.softDelete = function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
};

messageSchema.methods.createSystemMessage = function(action, data = {}) {
  this.messageType = 'system';
  this.systemData = {
    action: action,
    previousValue: data.previousValue || null,
    newValue: data.newValue || null,
    metadata: data.metadata || {}
  };
  
  // Generate system message content based on action
  this.content = this.generateSystemMessageContent(action, data);
};

messageSchema.methods.generateSystemMessageContent = function(action, data = {}) {
  const systemMessages = {
    'trade_accepted': 'Trade proposal has been accepted!',
    'trade_started': 'Trade has started. Good luck!',
    'trade_completed': 'Trade has been completed successfully!',
    'trade_cancelled': `Trade has been cancelled. Reason: ${data.reason || 'No reason provided'}`,
    'milestone_completed': `Milestone "${data.milestone}" has been completed!`,
    'progress_updated': `Progress updated to ${data.progress}%`,
    'meeting_scheduled': `Meeting scheduled for ${data.dateTime}`,
    'user_joined': `${data.userName} joined the conversation`,
    'user_left': `${data.userName} left the conversation`
  };

  return systemMessages[action] || 'System notification';
};

module.exports = mongoose.model('Message', messageSchema);