# SkillSwap - Quick Start Guide 🚀

Welcome to SkillSwap! This guide will get you up and running in minutes.

## 🎯 What is SkillSwap?

SkillSwap is a skill-exchange freelancing platform that allows users to trade skills without money, fostering a collaborative ecosystem where everyone can learn, teach, and grow together.

## ⚡ Quick Setup (5 minutes)

### Prerequisites
- Node.js 18+ installed
- MongoDB running locally OR MongoDB Atlas account
- Git

### 1. Clone and Install
```bash
git clone https://github.com/yourusername/skillswap.git
cd skillswap
npm run setup
```

### 2. Configure Environment
The `.env` files are already set up for local development. No changes needed!

### 3. Start MongoDB (if using local MongoDB)
```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Windows
net start MongoDB

# Linux
sudo systemctl start mongod
```

### 4. Seed Database (Optional but Recommended)
```bash
npm run seed
```
This creates sample users, skills, and trades for testing.

### 5. Start Development Servers
```bash
npm run dev
```

🎉 **That's it!** Your SkillSwap platform is now running:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health**: http://localhost:5000/health

## 🧪 Test the Platform

### Sample Login Credentials
After seeding, you can login with:

**Regular Users:**
- john.doe@example.com / password123
- sarah.wilson@example.com / password123
- mike.chen@example.com / password123

**Admin User:**
- admin@skillswap.com / admin123

### What You Can Test
1. **Browse Skills**: Visit homepage and explore skill categories
2. **User Registration**: Sign up as a new user
3. **User Authentication**: Login/logout functionality
4. **Profile Management**: View and edit user profiles
5. **Skill Management**: Add/remove skills from your profile
6. **Trade Creation**: Create skill exchange offers
7. **Real-time Chat**: Message other users (Socket.IO)
8. **Admin Dashboard**: Login as admin to manage platform

## 🐳 Docker Alternative

If you prefer Docker:
```bash
# Development environment
npm run docker:dev

# Production environment
npm run docker:prod
```

## 🛠️ Development Commands

```bash
# Install dependencies
npm run setup

# Start development servers
npm run dev

# Start individual services
npm run dev:backend    # Backend only
npm run dev:frontend   # Frontend only

# Build for production
npm run build

# Run tests
npm run test

# Seed database with sample data
npm run seed

# Docker commands
npm run docker:dev     # Development with Docker
npm run docker:prod    # Production with Docker
```

## 📁 Project Structure

```
skillswap/
├── backend/           # Node.js + Express API
│   ├── controllers/   # Route controllers
│   ├── models/        # MongoDB models
│   ├── routes/        # API routes
│   ├── middleware/    # Auth & error handling
│   └── socket/        # Socket.IO handlers
├── frontend/          # React application
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/      # Page components
│   │   ├── context/    # React context
│   │   └── services/   # API services
└── deployment/        # Cloud deployment configs
```

## 🌟 Key Features Implemented

### ✅ Core Features
- [x] User registration and authentication
- [x] User profiles with skills showcase
- [x] Skill posting and search with filters
- [x] Trade offer system (propose, accept/reject, complete)
- [x] Real-time messaging (Socket.IO)
- [x] Trade lifecycle management
- [x] Rating and review system
- [x] Admin dashboard

### ✅ Technical Features
- [x] RESTful API with comprehensive error handling
- [x] JWT-based authentication
- [x] Real-time WebSocket communication
- [x] Responsive Material-UI design
- [x] MongoDB with optimized schemas
- [x] Docker containerization
- [x] Multiple deployment options
- [x] Comprehensive security measures

## 🚀 Deployment Options

### Quick Deploy (Recommended for MVP)
1. **Render.com**: Upload `deployment/render.yaml` - Free tier available!
2. **Railway**: `railway up` - One-command deployment
3. **Vercel**: Perfect for frontend with automatic deployments

### Production Ready
- **AWS**: Full Terraform infrastructure in `deployment/aws/`
- **DigitalOcean**: App Platform with managed services
- **Docker**: Production-ready containers included

See `docs/deployment.md` for detailed deployment instructions.

## 📚 Learn More

- **API Documentation**: `docs/api.md`
- **Deployment Guide**: `docs/deployment.md`
- **Database Schema**: Check `backend/models/`

## 🆘 Troubleshooting

### Common Issues

**MongoDB Connection Error:**
- Ensure MongoDB is running locally
- Check connection string in `backend/.env`
- For cloud MongoDB, verify network access

**Port Already in Use:**
- Backend: Change `PORT` in `backend/.env`
- Frontend: Change port with `PORT=3001 npm start`

**CORS Errors:**
- Verify `CLIENT_URL` in `backend/.env`
- Check frontend API URL in `frontend/.env`

**Build Failures:**
- Clear node_modules: `rm -rf */node_modules && npm run setup`
- Update Node.js to version 18+

## 💡 Next Steps

### For Hackathons
1. Customize the UI theme and branding
2. Add specific skill categories for your domain
3. Implement additional features from the roadmap
4. Deploy to a free cloud platform
5. Add custom domain and SSL

### For Production
1. Set up monitoring and logging
2. Implement email notifications
3. Add advanced search and filtering
4. Create mobile app with React Native
5. Scale infrastructure based on traffic

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📞 Support

- **Documentation**: Check `docs/` folder
- **Issues**: Open a GitHub issue
- **Discussions**: Use GitHub Discussions for questions

---

**Built with ❤️ for hackathons, MVPs, and learning projects.**

Ready to start trading skills? Let's build something amazing together! 🌟