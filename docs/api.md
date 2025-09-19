# SkillSwap API Documentation

## Base URL
- Development: `http://localhost:5000/api`
- Production: `https://your-domain.com/api`

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Response Format
All API responses follow this format:
```json
{
  "success": true,
  "message": "Description of the result",
  "data": {...},
  "timestamp": "2023-09-18T10:30:00.000Z"
}
```

## Error Handling
Error responses include:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [...], // Optional validation errors
  "timestamp": "2023-09-18T10:30:00.000Z"
}
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user.
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "bio": "Full-stack developer",
  "location": {
    "city": "San Francisco",
    "country": "USA"
  }
}
```

#### POST /auth/login
Login user.
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### GET /auth/me
Get current user profile (Protected).

### Users

#### GET /users/search
Search users by skills, location, etc.
Query parameters:
- `keyword`: Search term
- `skills`: Comma-separated skills
- `location`: Location filter
- `rating`: Minimum rating
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

#### GET /users/:id
Get user profile by ID.

#### PUT /users/profile
Update user profile (Protected).

### Skills

#### GET /skills
Get all skills with search and filter.
Query parameters:
- `search`: Search term
- `category`: Filter by category
- `difficulty`: Filter by difficulty level
- `page`: Page number
- `limit`: Items per page

#### GET /skills/categories
Get skill categories.

#### GET /skills/popular
Get popular skills.

### Trades

#### GET /trades
Get user's trades (Protected).

#### POST /trades
Create new trade offer (Protected).
```json
{
  "provider": "provider_user_id",
  "title": "JavaScript for UI Design",
  "description": "I can teach JavaScript in exchange for UI design help",
  "requestedSkill": {
    "name": "UI Design",
    "level": "Intermediate",
    "category": "Design",
    "description": "Modern UI design principles",
    "estimatedHours": 10
  },
  "offeredSkill": {
    "name": "JavaScript",
    "level": "Expert",
    "category": "Technology", 
    "description": "Advanced JavaScript development",
    "estimatedHours": 10
  }
}
```

#### GET /trades/:id
Get single trade (Protected).

#### PUT /trades/:id/status
Update trade status (Protected).
```json
{
  "status": "accepted"
}
```

### Messages

#### GET /messages/conversations
Get user's recent conversations (Protected).

#### GET /messages/trades/:tradeId
Get messages for a trade (Protected).

#### GET /messages/unread-count
Get unread messages count (Protected).

### Admin (Admin only)

#### GET /admin/dashboard
Get admin dashboard statistics.

#### GET /admin/users
Get all users with pagination.

#### GET /admin/trades
Get all trades with pagination.

## WebSocket Events

### Connection
```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: 'your_jwt_token'
  }
});
```

### Events

#### trade:join
Join a trade room.
```javascript
socket.emit('trade:join', { tradeId: 'trade_id' });
```

#### message:send
Send a message.
```javascript
socket.emit('message:send', {
  tradeId: 'trade_id',
  content: 'Hello!',
  messageType: 'text'
});
```

#### message:new
Listen for new messages.
```javascript
socket.on('message:new', (data) => {
  console.log('New message:', data.message);
});
```

#### trade:update
Listen for trade updates.
```javascript
socket.on('trade:updated', (data) => {
  console.log('Trade updated:', data.trade);
});
```

## Rate Limiting
- Authentication endpoints: 5 requests per 15 minutes
- General API: 100 requests per 15 minutes
- File uploads: 10 requests per hour

## Status Codes
- `200`: OK
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `422`: Unprocessable Entity
- `429`: Too Many Requests
- `500`: Internal Server Error