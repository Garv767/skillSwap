# SkillSwap Deployment Guide

## Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- MongoDB (local or cloud)

### Local Development
1. Clone the repository
```bash
git clone <repository-url>
cd skillswap
```

2. Set up environment variables
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. Start services with Docker Compose
```bash
# Development environment
npm run docker:dev

# Production environment  
npm run docker:prod
```

4. Access the application
- Frontend: http://localhost:3000 (dev) or http://localhost:80 (prod)
- Backend API: http://localhost:5000
- MongoDB: localhost:27017

### Database Seeding
```bash
# Seed the database with sample data
npm run seed
```

## Cloud Deployment Options

### 1. Render.com (Recommended for MVP)

#### Setup
1. Fork this repository to your GitHub account
2. Create a Render account and connect your GitHub
3. Create a new Blueprint and upload `deployment/render.yaml`
4. Configure environment variables:
   - `JWT_SECRET`: Generate a secure secret
   - `NODE_ENV`: production
   - `CLIENT_URL`: Your frontend URL from Render

#### Database
- Render automatically provisions MongoDB
- Connection string provided via environment variable

#### Cost
- Starter plan: Free tier available
- Estimated monthly cost: $0-25 for MVP traffic

### 2. Railway

#### Setup
1. Install Railway CLI
```bash
npm install -g @railway/cli
```

2. Login and deploy
```bash
railway login
railway link
railway up
```

3. Configure environment variables in Railway dashboard
4. Connect MongoDB Atlas or use Railway's database addon

#### Cost
- Usage-based pricing
- Estimated monthly cost: $5-20 for MVP traffic

### 3. Heroku

#### Backend Deployment
1. Install Heroku CLI
2. Create and configure app
```bash
heroku create skillswap-backend
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=<your-secret>
heroku config:set MONGODB_URI=<your-mongodb-uri>
git subtree push --prefix backend heroku main
```

#### Frontend Deployment
1. Create separate app for frontend
```bash
heroku create skillswap-frontend
heroku buildpacks:set https://github.com/mars/create-react-app-buildpack.git
heroku config:set REACT_APP_API_URL=https://skillswap-backend.herokuapp.com/api
git subtree push --prefix frontend heroku main
```

### 4. AWS (Production-Ready)

#### Using Terraform
1. Install Terraform and AWS CLI
2. Configure AWS credentials
```bash
aws configure
```

3. Deploy infrastructure
```bash
cd deployment/aws
terraform init
terraform plan
terraform apply
```

#### Manual Setup
1. **ECS Cluster**: Create cluster for containerized apps
2. **RDS/DocumentDB**: Managed MongoDB-compatible database
3. **ALB**: Application Load Balancer for traffic routing
4. **CloudFront**: CDN for frontend assets
5. **Route53**: DNS management

#### Estimated Cost
- Small production setup: $50-100/month
- Includes database, compute, storage, and network costs

### 5. Vercel + PlanetScale

#### Frontend (Vercel)
1. Connect GitHub repository to Vercel
2. Configure build settings:
   - Framework: Create React App
   - Root Directory: frontend
   - Build Command: npm run build
   - Output Directory: build

#### Backend (Railway/Render)
- Deploy backend to Railway or Render
- Use PlanetScale for MySQL (with MongoDB adapter)

### 6. DigitalOcean App Platform

#### Setup
1. Connect GitHub repository
2. Configure components:
   - **Backend**: Node.js app from `/backend`
   - **Frontend**: Static site from `/frontend`
   - **Database**: Managed MongoDB

3. Set environment variables
4. Deploy with automatic builds from main branch

## Environment Variables

### Backend (.env)
```bash
# Server
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb://user:pass@host:port/dbname

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=7d

# Client
CLIENT_URL=https://your-frontend-domain.com

# Optional: Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Optional: File uploads
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Frontend (.env)
```bash
REACT_APP_API_URL=https://your-backend-domain.com/api
```

## Database Setup

### MongoDB Atlas (Cloud)
1. Create account at https://mongodb.com
2. Create new cluster (free tier available)
3. Create database user and get connection string
4. Whitelist your deployment platform's IPs
5. Use connection string in `MONGODB_URI`

### Local MongoDB
```bash
# Install MongoDB
# macOS
brew install mongodb-community

# Ubuntu
sudo apt install mongodb

# Start MongoDB
mongod --dbpath /data/db
```

## Performance Optimization

### Backend
- Enable compression middleware
- Implement Redis caching
- Use PM2 for process management in production
- Configure proper database indexes

### Frontend  
- Enable gzip compression in nginx
- Implement service worker for offline support
- Optimize bundle size with code splitting
- Use CDN for static assets

### Database
- Create proper indexes for search queries
- Implement database query optimization
- Set up MongoDB replica set for high availability
- Regular database backups

## Monitoring and Logging

### Application Monitoring
- **Error Tracking**: Sentry or Bugsnag
- **Performance**: New Relic or DataDog
- **Uptime**: Pingdom or UptimeRobot

### Logging
```javascript
// Backend logging setup
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## SSL/HTTPS Setup

### Using Let's Encrypt (Free)
```bash
# Install certbot
sudo apt install certbot

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Using CloudFlare (Recommended)
1. Point your domain to CloudFlare
2. Enable SSL/TLS encryption
3. Configure automatic HTTPS redirects
4. Enable caching and optimization features

## CI/CD Pipeline

### GitHub Actions
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: |
        cd backend && npm ci
        cd ../frontend && npm ci
        
    - name: Run tests
      run: |
        cd backend && npm test
        cd ../frontend && npm test -- --coverage --watchAll=false
        
    - name: Deploy to Render
      run: |
        # Add your deployment commands here
```

## Security Checklist

### Backend Security
- [x] Environment variables for secrets
- [x] JWT token expiration
- [x] Rate limiting on authentication
- [x] Input validation and sanitization
- [x] CORS configuration
- [x] Helmet.js security headers
- [x] MongoDB injection prevention

### Frontend Security
- [x] HTTPS enforcement
- [x] Content Security Policy
- [x] XSS prevention
- [x] Secure cookie settings
- [x] No sensitive data in localStorage

### Infrastructure Security
- [x] Database access restricted
- [x] API endpoints protected
- [x] Regular security updates
- [x] Backup and recovery plan
- [x] DDoS protection

## Backup and Recovery

### Database Backups
```bash
# MongoDB backup
mongodump --uri="mongodb://user:pass@host:port/dbname" --out /backup/path

# Restore
mongorestore --uri="mongodb://user:pass@host:port/dbname" /backup/path/dbname
```

### Automated Backups
- Set up daily database backups
- Store backups in different geographic location
- Test restore procedures regularly
- Document recovery procedures

## Cost Optimization

### Development/MVP Stage
- Use free tiers where possible
- Render.com or Railway for backend
- Vercel or Netlify for frontend  
- MongoDB Atlas free tier
- **Estimated Cost**: $0-25/month

### Production Stage
- Optimize for traffic patterns
- Use CDN for static assets
- Implement efficient caching
- Monitor and optimize database queries
- **Estimated Cost**: $50-200/month depending on traffic

## Support and Maintenance

### Regular Tasks
- Monitor application performance
- Review error logs and fix issues
- Update dependencies and security patches
- Backup database regularly
- Monitor user feedback and iterate

### Scaling Considerations
- Horizontal scaling with load balancers
- Database sharding for large datasets
- Microservices architecture for complex features
- Implement caching layers (Redis)
- CDN for global content delivery