# Railway.com Deployment Guide

This guide covers deploying the Wallet Application to Railway.com using Docker.

## Prerequisites

- Railway.com account
- MongoDB database (can use Railway's MongoDB service or MongoDB Atlas)
- Git repository (GitHub, GitLab, or Bitbucket)

## Quick Start

### 1. Create Projects on Railway

1. **Backend Service**
   - Go to Railway dashboard
   - Click "New Project"
   - Select "Deploy from GitHub repo" (or your Git provider)
   - Choose the repository and select `backend/` as the root directory
   - Railway will automatically detect the Dockerfile

2. **Frontend Service**
   - Create another service in the same project
   - Select the same repository
   - Choose `frontend/` as the root directory

### 2. Set Environment Variables

#### Backend Service

In Railway dashboard → Backend Service → Variables:

```env
MONGODB_URI=mongodb+srv://admin:password@cluster.mongodb.net/wallet?retryWrites=true&w=majority
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend-domain.railway.app
LOG_LEVEL=info
```

**Note**: Railway automatically provides `PORT` variable. You can remove it from .env, but it's kept for local development compatibility.

#### Frontend Service

In Railway dashboard → Frontend Service → Variables:

```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.railway.app
PORT=3000
```

**Note**: Railway automatically assigns PORT. `NEXT_PUBLIC_API_URL` must point to your backend service URL.

### 3. Configure MongoDB

**Option A: Railway MongoDB**
- Add MongoDB service from Railway's template
- Use the connection string in `MONGODB_URI`

**Option B: MongoDB Atlas**
- Create cluster on MongoDB Atlas
- Get connection string
- Set `MONGODB_URI` in Railway environment variables

### 4. Deploy

1. **Backend**: Railway will automatically build and deploy from `backend/Dockerfile`
2. **Frontend**: Railway will automatically build and deploy from `frontend/Dockerfile`

### 5. Set Up Domain (Optional)

- Backend: Railway → Backend Service → Settings → Generate Domain
- Frontend: Railway → Frontend Service → Settings → Generate Domain
- Update `FRONTEND_URL` in backend service with the frontend domain
- Update `NEXT_PUBLIC_API_URL` in frontend service with the backend domain

## Dockerfile Details

### Backend Dockerfile

- **Multi-stage build**: Reduces final image size
- **Production dependencies only**: Excludes dev dependencies
- **Non-root user**: Runs as `nestjs` user for security
- **Health check**: Automatically monitors service health
- **Port**: Uses `PORT` environment variable (Railway sets this automatically)

### Frontend Dockerfile

- **Standalone output**: Next.js standalone mode for minimal Docker image
- **Static assets**: Copies `.next/static` for optimized loading
- **Non-root user**: Runs as `nextjs` user for security
- **Health check**: Monitors service availability
- **Build args**: `NEXT_PUBLIC_API_URL` can be set during build

## Important Configuration

### Next.js Standalone Mode

The `next.config.js` has `output: 'standalone'` enabled. This:
- Creates a minimal `server.js` file
- Includes only necessary dependencies
- Reduces Docker image size significantly

### Worker Threads

The backend CSV worker (`csv.worker.ts`) is compiled to `.js` during build and included in the `dist/` directory. The worker path uses `__dirname` which works correctly in Docker.

### Environment Variables

Railway automatically:
- Provides `PORT` environment variable
- Assigns dynamic ports
- Connects services in the same project

## Troubleshooting

### Backend Build Fails

1. **Check MongoDB URI**: Ensure `MONGODB_URI` is correctly set
2. **Check Node version**: Dockerfile uses Node 18
3. **Check build logs**: Railway dashboard → Deployments → View logs

### Frontend Build Fails

1. **Check `NEXT_PUBLIC_API_URL`**: Must be set during build
2. **Check Next.js config**: Ensure `output: 'standalone'` is enabled
3. **Check build logs**: Railway dashboard → Deployments → View logs

### Connection Issues

1. **CORS errors**: Update `FRONTEND_URL` in backend service with actual frontend domain
2. **API not reachable**: Check `NEXT_PUBLIC_API_URL` points to correct backend domain
3. **MongoDB connection**: Verify `MONGODB_URI` includes authentication and database name

### Worker Thread Not Found

If CSV export fails with "Cannot find module './csv.worker.js'":
- Ensure build completed successfully
- Check `dist/common/utils/csv.worker.js` exists in build
- Verify TypeScript compilation includes worker files

## Railway-Specific Features

### Automatic Deployments

- Railway deploys automatically on Git push
- Can configure deployment branch (default: main/master)
- Can pause auto-deployments if needed

### Service Health

- Health checks run automatically (defined in Dockerfile)
- Railway monitors service health
- Failed health checks trigger service restarts

### Logs and Monitoring

- View real-time logs in Railway dashboard
- Filter logs by service
- Set up alerts for errors (if Railway plan supports)

### Scaling

- Adjust resource allocation per service
- Horizontal scaling (if needed) via Railway's scaling features
- Auto-scaling based on metrics (if plan supports)

## Environment Variables Reference

### Backend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | ✅ Yes | - | MongoDB connection string |
| `PORT` | ❌ No | `3001` | Server port (Railway sets automatically) |
| `NODE_ENV` | ❌ No | `production` | Environment mode |
| `FRONTEND_URL` | ❌ No | - | Frontend URL for CORS (use Railway domain) |
| `LOG_LEVEL` | ❌ No | `info` | Logging level |

### Frontend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ Yes | - | Backend API URL (use Railway domain) |
| `PORT` | ❌ No | `3000` | Server port (Railway sets automatically) |
| `NODE_ENV` | ❌ No | `production` | Environment mode |

## Manual Deployment (Alternative)

If not using Git integration:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
cd backend
railway link

# Deploy backend
railway up

# Deploy frontend
cd ../frontend
railway link
railway up
```

## Cost Optimization

- Use Railway's free tier for development
- Optimize Docker images (already done with multi-stage builds)
- Use Railway's shared MongoDB service for cost savings
- Monitor resource usage in Railway dashboard

## Security Best Practices

✅ Both Dockerfiles run as non-root users  
✅ Environment variables stored securely in Railway  
✅ Production dependencies only in final images  
✅ Health checks enabled for monitoring  
⚠️ Consider adding rate limiting in production  
⚠️ Consider adding API authentication in production  

## Support

- Railway Documentation: https://docs.railway.app
- Railway Community: https://discord.gg/railway

---

**Ready to deploy?** Push your code to GitHub and Railway will automatically detect and build your Dockerfiles!
