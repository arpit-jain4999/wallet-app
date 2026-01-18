#!/bin/bash
# Build script for Docker images
# Usage: ./build.sh [backend|frontend|all]

set -e

BACKEND_TAG="wallet-backend:latest"
FRONTEND_TAG="wallet-frontend:latest"
NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-http://localhost:3001}"

build_backend() {
  echo "🔨 Building backend..."
  docker build --target backend -t "$BACKEND_TAG" .
  echo "✅ Backend built successfully: $BACKEND_TAG"
}

build_frontend() {
  echo "🔨 Building frontend..."
  docker build \
    --target frontend \
    --build-arg NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" \
    -t "$FRONTEND_TAG" .
  echo "✅ Frontend built successfully: $FRONTEND_TAG"
}

case "${1:-all}" in
  backend)
    build_backend
    ;;
  frontend)
    build_frontend
    ;;
  all)
    build_backend
    build_frontend
    echo ""
    echo "🎉 All images built successfully!"
    echo ""
    echo "To run:"
    echo "  Backend:  docker run -p 3001:3001 -e MONGODB_URI=... $BACKEND_TAG"
    echo "  Frontend: docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=... $FRONTEND_TAG"
    ;;
  *)
    echo "Usage: $0 [backend|frontend|all]"
    exit 1
    ;;
esac
