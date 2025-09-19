const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Trade = require('../models/Trade');
const Message = require('../models/Message');

// Store active connections
const activeUsers = new Map();
const activeRooms = new Map();

const socketHandler = (io) => {
  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user data
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user || !user.isActive) {
        return next(new Error('Authentication error: Invalid user'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User ${socket.user.firstName} connected: ${socket.id}`);
    
    // Store user connection
    activeUsers.set(socket.userId, {
      socketId: socket.id,
      user: socket.user,
      connectedAt: new Date(),
      status: 'online'
    });

    // Notify user's trade partners about online status
    notifyTradePartnersStatus(socket.userId, 'online', io);

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Send initial data
    socket.emit('connection:success', {
      message: 'Connected successfully',
      user: {
        id: socket.user._id,
        firstName: socket.user.firstName,
        lastName: socket.user.lastName,
        avatar: socket.user.avatar
      }
    });

    // Handle joining trade rooms
    socket.on('trade:join', async (data) => {
      try {
        const { tradeId } = data;
        
        // Verify user is participant in this trade
        const trade = await Trade.findById(tradeId);
        if (!trade || !trade.isParticipant(socket.userId)) {
          socket.emit('error', { message: 'Not authorized to join this trade' });
          return;
        }

        const roomName = `trade:${tradeId}`;
        socket.join(roomName);

        // Track active rooms
        if (!activeRooms.has(roomName)) {
          activeRooms.set(roomName, new Set());
        }
        activeRooms.get(roomName).add(socket.userId);

        console.log(`📱 User ${socket.user.firstName} joined trade room: ${tradeId}`);

        // Notify other participants
        socket.to(roomName).emit('user:joined', {
          userId: socket.userId,
          user: {
            id: socket.user._id,
            firstName: socket.user.firstName,
            lastName: socket.user.lastName,
            avatar: socket.user.avatar
          },
          timestamp: new Date()
        });

        socket.emit('trade:joined', { tradeId, message: 'Joined trade successfully' });

      } catch (error) {
        console.error('Trade join error:', error);
        socket.emit('error', { message: 'Failed to join trade' });
      }
    });

    // Handle leaving trade rooms
    socket.on('trade:leave', (data) => {
      const { tradeId } = data;
      const roomName = `trade:${tradeId}`;
      
      socket.leave(roomName);
      
      // Remove from active rooms
      if (activeRooms.has(roomName)) {
        activeRooms.get(roomName).delete(socket.userId);
        if (activeRooms.get(roomName).size === 0) {
          activeRooms.delete(roomName);
        }
      }

      // Notify other participants
      socket.to(roomName).emit('user:left', {
        userId: socket.userId,
        timestamp: new Date()
      });

      socket.emit('trade:left', { tradeId });
    });

    // Handle sending messages
    socket.on('message:send', async (data) => {
      try {
        const { tradeId, content, messageType = 'text', replyTo = null } = data;

        // Validate trade participation
        const trade = await Trade.findById(tradeId);
        if (!trade || !trade.isParticipant(socket.userId)) {
          socket.emit('error', { message: 'Not authorized to send messages in this trade' });
          return;
        }

        // Get recipient (other participant)
        const recipientId = trade.getOtherParticipant(socket.userId);

        // Create message
        const message = new Message({
          sender: socket.userId,
          recipient: recipientId,
          trade: tradeId,
          content,
          messageType,
          replyTo,
          status: 'sent',
          metadata: {
            ipAddress: socket.handshake.address,
            userAgent: socket.handshake.headers['user-agent']
          }
        });

        await message.save();

        // Populate message data
        await message.populate([
          { path: 'sender', select: 'firstName lastName avatar' },
          { path: 'recipient', select: 'firstName lastName avatar' },
          { path: 'replyTo', select: 'content sender createdAt' }
        ]);

        // Update trade message count and last message time
        trade.messageCount += 1;
        trade.lastMessageAt = new Date();
        await trade.save();

        // Mark as delivered if recipient is online
        if (activeUsers.has(recipientId.toString())) {
          message.status = 'delivered';
          message.deliveredAt = new Date();
          await message.save();
        }

        const roomName = `trade:${tradeId}`;
        
        // Emit to trade room
        io.to(roomName).emit('message:new', {
          message: message.toObject(),
          trade: {
            id: trade._id,
            messageCount: trade.messageCount
          }
        });

        // Send push notification to recipient if offline
        if (!activeUsers.has(recipientId.toString())) {
          // Here you would integrate with a push notification service
          console.log(`📨 Push notification needed for user ${recipientId}`);
        }

        console.log(`💬 Message sent in trade ${tradeId} by ${socket.user.firstName}`);

      } catch (error) {
        console.error('Message send error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle message read status
    socket.on('message:read', async (data) => {
      try {
        const { tradeId, messageId } = data;

        // Mark specific message as read
        if (messageId) {
          await Message.findOneAndUpdate(
            { _id: messageId, recipient: socket.userId },
            { 
              status: 'read',
              readAt: new Date()
            }
          );
        } else {
          // Mark all messages in trade as read
          await Message.markAsRead(tradeId, socket.userId);
        }

        // Notify sender about read status
        const roomName = `trade:${tradeId}`;
        socket.to(roomName).emit('message:read', {
          tradeId,
          messageId,
          readBy: socket.userId,
          readAt: new Date()
        });

      } catch (error) {
        console.error('Message read error:', error);
        socket.emit('error', { message: 'Failed to mark message as read' });
      }
    });

    // Handle typing indicators
    socket.on('typing:start', (data) => {
      const { tradeId } = data;
      const roomName = `trade:${tradeId}`;
      
      socket.to(roomName).emit('typing:start', {
        userId: socket.userId,
        user: {
          firstName: socket.user.firstName,
          lastName: socket.user.lastName
        },
        tradeId
      });
    });

    socket.on('typing:stop', (data) => {
      const { tradeId } = data;
      const roomName = `trade:${tradeId}`;
      
      socket.to(roomName).emit('typing:stop', {
        userId: socket.userId,
        tradeId
      });
    });

    // Handle trade status updates
    socket.on('trade:update', async (data) => {
      try {
        const { tradeId, status, progress, milestone } = data;

        const trade = await Trade.findById(tradeId);
        if (!trade || !trade.isParticipant(socket.userId)) {
          socket.emit('error', { message: 'Not authorized to update this trade' });
          return;
        }

        let systemMessage = null;
        let updated = false;

        // Handle status updates
        if (status && trade.status !== status) {
          const allowedTransitions = {
            'pending': ['accepted', 'cancelled'],
            'negotiating': ['accepted', 'cancelled'],
            'accepted': ['in_progress', 'cancelled'],
            'in_progress': ['completed', 'cancelled', 'disputed'],
            'disputed': ['in_progress', 'cancelled']
          };

          if (allowedTransitions[trade.status]?.includes(status)) {
            trade.status = status;
            updated = true;

            // Create system message
            systemMessage = new Message({
              sender: socket.userId,
              recipient: trade.getOtherParticipant(socket.userId),
              trade: tradeId,
              content: `Trade status updated to ${status}`,
              messageType: 'system'
            });
            
            systemMessage.createSystemMessage(`trade_${status}`, { status });
          }
        }

        // Handle progress updates
        if (progress !== undefined) {
          trade.updateProgress(socket.userId, progress);
          updated = true;

          systemMessage = new Message({
            sender: socket.userId,
            recipient: trade.getOtherParticipant(socket.userId),
            trade: tradeId,
            content: `Progress updated to ${progress}%`,
            messageType: 'system'
          });
          
          systemMessage.createSystemMessage('progress_updated', { progress });
        }

        // Handle milestone updates
        if (milestone) {
          if (milestone.action === 'add') {
            trade.addMilestone(milestone.data);
            updated = true;
          } else if (milestone.action === 'complete') {
            trade.completeMilestone(milestone.milestoneId, socket.userId);
            updated = true;

            systemMessage = new Message({
              sender: socket.userId,
              recipient: trade.getOtherParticipant(socket.userId),
              trade: tradeId,
              content: `Milestone completed: ${milestone.data.title}`,
              messageType: 'system'
            });
            
            systemMessage.createSystemMessage('milestone_completed', { 
              milestone: milestone.data.title 
            });
          }
        }

        if (updated) {
          await trade.save();

          // Save system message if created
          if (systemMessage) {
            await systemMessage.save();
            await systemMessage.populate([
              { path: 'sender', select: 'firstName lastName avatar' },
              { path: 'recipient', select: 'firstName lastName avatar' }
            ]);
          }

          const roomName = `trade:${tradeId}`;
          
          // Notify all participants
          io.to(roomName).emit('trade:updated', {
            trade: trade.toObject(),
            systemMessage: systemMessage?.toObject(),
            updatedBy: socket.userId
          });

          console.log(`🔄 Trade ${tradeId} updated by ${socket.user.firstName}`);
        }

      } catch (error) {
        console.error('Trade update error:', error);
        socket.emit('error', { message: 'Failed to update trade' });
      }
    });

    // Handle user status updates
    socket.on('status:update', (data) => {
      const { status } = data; // online, away, busy, offline
      
      if (activeUsers.has(socket.userId)) {
        activeUsers.get(socket.userId).status = status;
        notifyTradePartnersStatus(socket.userId, status, io);
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`🔌 User ${socket.user.firstName} disconnected: ${reason}`);
      
      // Remove from active users
      activeUsers.delete(socket.userId);
      
      // Remove from all active rooms
      activeRooms.forEach((users, roomName) => {
        if (users.has(socket.userId)) {
          users.delete(socket.userId);
          socket.to(roomName).emit('user:left', {
            userId: socket.userId,
            timestamp: new Date()
          });
          
          if (users.size === 0) {
            activeRooms.delete(roomName);
          }
        }
      });

      // Notify trade partners about offline status
      notifyTradePartnersStatus(socket.userId, 'offline', io);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      socket.emit('error', { 
        message: 'An error occurred',
        timestamp: new Date()
      });
    });
  });
};

// Helper function to notify trade partners about user status
const notifyTradePartnersStatus = async (userId, status, io) => {
  try {
    // Find all active trades for this user
    const trades = await Trade.find({
      $or: [
        { requester: userId },
        { provider: userId }
      ],
      status: { $in: ['pending', 'negotiating', 'accepted', 'in_progress'] }
    });

    // Notify each trade partner
    trades.forEach(trade => {
      const partnerId = trade.getOtherParticipant(userId);
      if (partnerId && activeUsers.has(partnerId.toString())) {
        io.to(`user:${partnerId}`).emit('user:status', {
          userId,
          status,
          timestamp: new Date(),
          tradeId: trade._id
        });
      }
    });
  } catch (error) {
    console.error('Error notifying trade partners:', error);
  }
};

// Helper function to get online users count
const getOnlineUsersCount = () => {
  return activeUsers.size;
};

// Helper function to get active rooms count
const getActiveRoomsCount = () => {
  return activeRooms.size;
};

// Helper function to check if user is online
const isUserOnline = (userId) => {
  return activeUsers.has(userId.toString());
};

// Helper function to get user's socket
const getUserSocket = (userId, io) => {
  const user = activeUsers.get(userId.toString());
  return user ? io.sockets.sockets.get(user.socketId) : null;
};

module.exports = socketHandler;
module.exports.getOnlineUsersCount = getOnlineUsersCount;
module.exports.getActiveRoomsCount = getActiveRoomsCount;
module.exports.isUserOnline = isUserOnline;
module.exports.getUserSocket = getUserSocket;