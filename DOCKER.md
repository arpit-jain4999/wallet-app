# Docker Deployment Guide

This project includes Dockerfiles for deploying to Railway.com or any Docker-compatible platform.

## 📦 Dockerfiles

### Backend (`backend/Dockerfile`)
- Multi-stage build for optimized image size
- Production dependencies only
- Runs as non-root user (`nestjs`)
- Health check endpoint: `/health`
- Port: `3001` (configurable via `PORT` env var)

### Frontend (`frontend/Dockerfile`)
- Multi-stage build with Next.js standalone mode
- Optimized static asset handling
- Runs as non-root user (`nextjs`)
- Health check on root endpoint
- Port: `3000` (configurable via `PORT` env var)

## 🚀 Quick Start

### Local Testing

**Build Backend:**
```bash
cd backend
docker build -t wallet-backend .
docker run -p 3001:3001 \
  -e MONGODB_URI=mongodb://localhost:27017/wallet \
  -e FRONTEND_URL=http://localhost:3000 \
  wallet-backend
```

**Build Frontend:**
```bash
cd frontend
docker build -t wallet-frontend \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:3001 \
  .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://localhost:3001 \
  wallet-frontend
```

### Railway.com Deployment

See `RAILWAY_DEPLOYMENT.md` for detailed Railway.com deployment instructions.

**Quick Steps:**
1. Push code to GitHub/GitLab
2. Create Railway project
3. Add services for `backend/` and `frontend/`
4. Set environment variables
5. Deploy!

## 📋 Environment Variables

### Backend
- `MONGODB_URI` (required) - MongoDB connection string
- `PORT` (optional) - Server port (default: 3001)
- `NODE_ENV` (optional) - Environment (default: production)
- `FRONTEND_URL` (optional) - Frontend URL for CORS
- `LOG_LEVEL` (optional) - Logging level (default: info)

### Frontend
- `NEXT_PUBLIC_API_URL` (required) - Backend API URL
- `PORT` (optional) - Server port (default: 3000)
- `NODE_ENV` (optional) - Environment (default: production)

## 🔍 Health Checks

Both Dockerfiles include health checks:

- **Backend**: `GET /health` (returns 200 when healthy)
- **Frontend**: `GET /` (returns 200 when healthy)

Health checks run every 30 seconds with a 3-second timeout.

## 🛡️ Security

✅ Runs as non-root users  
✅ Production dependencies only  
✅ Multi-stage builds reduce attack surface  
✅ Environment variables for sensitive data  

## 📝 Notes

- **Worker Threads**: CSV worker files are automatically included in build
- **Next.js Standalone**: Enabled for minimal Docker image size
- **Port Configuration**: Railway automatically sets `PORT` - no manual config needed

## 🐛 Troubleshooting

**Build Fails:**
- Check Node version (requires 18+)
- Verify package.json exists
- Check Dockerfile paths are correct

**Runtime Errors:**
- Verify environment variables are set
- Check MongoDB connection string
- Review Railway logs

**Worker Thread Not Found:**
- Ensure build completed successfully
- Check `dist/common/utils/csv.worker.js` exists
- Verify TypeScript compilation includes worker files
