# Wallet App

A modern, production-ready full-stack wallet management application built with Next.js, NestJS, and MongoDB. This application provides a complete solution for managing wallets, transactions, and financial data with precision handling, real-time updates, and scalable architecture.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.0-black)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.x-red.svg)](https://nestjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-green.svg)](https://www.mongodb.com/)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Development](#-development)
- [Testing](#-testing)
- [Configuration](#-configuration)
- [Performance](#-performance)

## ✨ Features

### Core Features

- **Wallet Management**
  - Create wallet with optional initial balance
  - View wallet details and real-time balance
  - Persistent wallet storage in localStorage
  - Wallet summary with total credits, debits, and transaction count

- **Transaction Management**
  - Credit/Debit operations with precise amount handling
  - Transaction history with server-side pagination
  - Advanced filtering (type, date range)
  - Full-text search across transaction descriptions
  - Sortable columns (date, amount)
  - Export transactions to CSV (smart sync/async based on volume)

- **User Interface**
  - Responsive design (mobile, tablet, desktop)
  - Modern UI with shadcn/ui components
  - Real-time progress tracking for large exports
  - Skeleton screens for better perceived performance
  - Optimistic updates with automatic rollback on errors
  - Toast notifications for user feedback
  - Error boundaries for graceful error handling

- **Performance & Scalability**
  - Server-side pagination, sorting, and filtering
  - Debounced search (300ms) to reduce API calls
  - Worker threads for CPU-intensive CSV generation
  - Batch processing for large datasets
  - Database indexes for optimal query performance
  - Request cancellation with AbortController

- ⚠️ **Authentication/Authorization**: Not implemented (out of scope)

### Advanced Features

- **Smart CSV Export**
  - Automatic sync/async detection based on transaction count
  - Real-time progress updates via Server-Sent Events (SSE)
  - Database-backed job storage for scalability
  - Automatic job cleanup (TTL index)

- **Developer Experience**
  - TypeScript throughout for type safety
  - Comprehensive error handling with custom error classes
  - Retry logic with exponential backoff
  - Winston logging with structured logs
  - Swagger/OpenAPI documentation
  - Environment variable validation

## 🛠 Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14.0.4 | React framework with App Router |
| **React** | 18.2.0 | UI library |
| **TypeScript** | 5.x | Type safety |
| **Tailwind CSS** | 3.x | Utility-first CSS framework |
| **shadcn/ui** | Latest | Accessible UI components |
| **Jest** | Latest | Testing framework |
| **React Testing Library** | Latest | Component testing |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **NestJS** | 10.x | Node.js framework |
| **Fastify** | Latest | High-performance HTTP server |
| **MongoDB** | 6.0+ | NoSQL database |
| **Mongoose** | 8.x | MongoDB ODM |
| **Winston** | 3.11.0 | Logging library |
| **class-validator** | 0.14.x | DTO validation |
| **Swagger** | 7.1.17 | API documentation |

## 🏗 Architecture

### Frontend Architecture

```
┌─────────────┐
│ Components  │ ← Presentational & Container Components
└──────┬──────┘
       │
┌──────▼──────┐
│    Hooks    │ ← Custom React Hooks (useWallet, useDataGrid, useExport)
└──────┬──────┘
       │
┌──────▼──────┐
│  Services   │ ← API Integration Layer (wallet.service, transactions.service)
└──────┬──────┘
       │
┌──────▼──────┐
│ API Client  │ ← HTTP Client with Retry Logic & Error Handling
└─────────────┘
```

**Data Flow Pattern:**
1. **Components** trigger user actions
2. **Hooks** manage state and business logic
3. **Services** handle API integration
4. **API Client** performs HTTP requests with retry/error handling

### Backend Architecture

```
┌─────────────┐
│ Controller  │ ← HTTP Request Handling & Validation
└──────┬──────┘
       │
┌──────▼──────┐
│   Service   │ ← Business Logic & Orchestration
└──────┬──────┘
       │
┌──────▼──────┐
│ Repository  │ ← Data Access Layer (Interface-based)
└──────┬──────┘
       │
┌──────▼──────┐
│  Database   │ ← MongoDB with Mongoose ODM
└─────────────┘
```

**Layer Responsibilities:**
- **Controller**: Request validation, response formatting, HTTP status codes
- **Service**: Business logic, transaction orchestration, error handling
- **Repository**: Data access abstraction, database queries, type conversions
- **Database**: Data persistence with indexes for performance

### SOLID Principles

The codebase follows SOLID principles:

- **Single Responsibility**: Each class/module has one clear purpose
- **Open/Closed**: Extensible through interfaces and abstractions
- **Liskov Substitution**: Repository interfaces allow implementation swapping
- **Interface Segregation**: Clean, focused interfaces (IWalletRepository, ITransactionRepository)
- **Dependency Inversion**: Services depend on repository interfaces, not concrete implementations

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **MongoDB** >= 6.0 (local or MongoDB Atlas)
- **npm** or **yarn**
- **Git** (for cloning)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/arpit-jain4999/wallet-app
cd wallet-app
```

2. **Install dependencies**

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd ../frontend
npm install
```

3. **Configure environment variables**

**Backend** (create `.env` in `backend/` directory):
```env
# Required
MONGODB_URI=mongodb://localhost:27017/wallet

# Optional (with defaults)
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info
```

**Frontend** (create `.env.local` in `frontend/` directory):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

4. **Start MongoDB**

**Option 1: Docker (Recommended)**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Option 2: Local Installation**
```bash
mongod
```

5. **Start the applications**

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

6. **Access the application**

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Swagger API Docs**: http://localhost:3001/api

## 📁 Project Structure

```
wallet-app/
├── backend/                      # NestJS backend application
│   ├── src/
│   │   ├── common/              # Shared utilities and modules
│   │   │   ├── filters/        # HTTP exception filter
│   │   │   ├── logger/         # Winston logger module
│   │   │   └── utils/          # Utility functions (money, CSV, pagination)
│   │   ├── config/             # Configuration files
│   │   │   ├── constants.ts    # Application constants
│   │   │   └── env.validation.ts  # Environment variable validation
│   │   ├── modules/            # Feature modules
│   │   │   ├── health/         # Health check module
│   │   │   └── wallet/         # Wallet module
│   │   │       ├── dto/        # Data Transfer Objects
│   │   │       ├── interfaces/ # Repository interfaces
│   │   │       ├── repositories/ # Repository implementations
│   │   │       ├── schemas/    # Mongoose schemas
│   │   │       ├── services/   # Business logic services
│   │   │       └── wallet.controller.ts
│   │   └── main.ts             # Application entry point
│   ├── dist/                   # Compiled JavaScript (generated)
│   ├── test/                   # E2E tests
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                    # Next.js frontend application
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── page.tsx            # Home page
│   │   └── transactions/       # Transactions page
│   ├── components/             # React components
│   │   ├── error/             # Error boundary
│   │   ├── layout/            # Layout components (Sidebar, Header, MobileNav)
│   │   ├── transactions/      # Transaction-specific components
│   │   ├── ui/                # Reusable UI components (shadcn/ui)
│   │   │   └── data-grid/    # DataGrid component
│   │   └── wallet/            # Wallet-specific components
│   ├── contexts/              # React Context providers
│   │   └── WalletContext.tsx  # Global wallet state
│   ├── hooks/                 # Custom React hooks
│   │   ├── useWallet.ts       # Wallet operations hook
│   │   ├── useDataGrid.ts     # Data grid state management
│   │   ├── useExport.ts       # CSV export hook
│   │   └── useWalletSummary.ts
│   ├── lib/                   # Utility libraries
│   │   ├── apiClient.ts       # HTTP client wrapper
│   │   ├── errors.ts          # Custom error classes
│   │   ├── storage.ts         # LocalStorage service
│   │   └── http/              # HTTP client interface
│   ├── services/              # API service layer
│   │   ├── wallet.service.ts
│   │   ├── transactions.service.ts
│   │   └── export.service.ts
│   ├── types/                 # TypeScript type definitions
│   ├── utils/                 # Utility functions
│   ├── constants/             # Constants and messages
│   ├── public/                # Static assets
│   └── package.json
│
├── scripts/                    # Utility scripts
│   └── generate-transactions.js  # Generate test transactions
│
└── README.md                   # This file
```

### Core API Endpoints

#### Wallet Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/setup` | Create a new wallet |
| `GET` | `/wallet/:id` | Get wallet details |
| `GET` | `/wallet/:id/summary` | Get transaction summary (totals) |

#### Transaction Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/transact/:walletId` | Execute credit/debit transaction |
| `GET` | `/transactions` | List transactions with filters |
| `GET` | `/transactions/export` | Export transactions as CSV |

#### Export Job Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/export-jobs/:jobId` | Get export job status |
| `GET` | `/export-jobs/:jobId/stream` | Stream export progress (SSE) |

#### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Application health status |

### API Examples

**Create Wallet:**
```bash
curl -X POST http://localhost:3001/setup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "balance": 100.50
  }'
```

**Execute Transaction:**
```bash
curl -X POST http://localhost:3001/transact/{walletId} \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50.25,
    "description": "Payment received",
    "type": "CREDIT"
  }'
```

**Get Transactions:**
```bash
curl "http://localhost:3001/transactions?walletId={walletId}&skip=0&limit=25&sortBy=date&sortOrder=desc"
```

For detailed API documentation, visit the Swagger UI at `/api`.

## 💻 Development

### Backend Development

```bash
cd backend

# Development mode with hot reload
npm run start:dev

# Production build
npm run build

# Start production server
npm run start:prod

# Lint code
npm run lint

# Format code
npm run format
```

### Frontend Development

```bash
cd frontend

# Development server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

### Code Quality

Both frontend and backend use:
- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting (backend)

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov

# E2E tests
npm run test:e2e
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Structure

- **Unit Tests**: Services, utilities, hooks
- **Integration Tests**: API endpoints, repositories
- **Component Tests**: React components with RTL
- **E2E Tests**: Full user workflows (backend)

## 🚀 Deployment

### Environment Variables

**Backend Production:**
```env
NODE_ENV=production
MONGODB_URI=mongodb://your-mongodb-uri/wallet
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com
LOG_LEVEL=info
```

**Frontend Production:**
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

### Build Commands

**Backend:**
```bash
cd backend
npm ci --production
npm run build
npm run start:prod
```

**Frontend:**
```bash
cd frontend
npm ci
npm run build
npm run start
```

### Deployment Platforms

- **Frontend**: Vercel, Netlify, or any Node.js hosting
- **Backend**: AWS, Heroku, DigitalOcean, or any Node.js hosting
- **Database**: MongoDB Atlas (recommended) or self-hosted MongoDB

For detailed deployment instructions, see `DEPLOYMENT.md`.

## ⚙️ Configuration

### Money Handling

The application uses **minor units** (4 decimal places) for precise financial calculations:

- **User Input**: `100.1234` (major units)
- **Storage**: `1001234` (minor units, multiplied by 10000)
- **Display**: `100.1234` (converted back)

This approach prevents floating-point precision issues common in financial applications.

### Constants

**Frontend** (`frontend/config/constants.ts`):
- API configuration
- Pagination defaults
- Search debounce timing (300ms)
- UI configuration

**Backend** (`backend/src/config/constants.ts`):
- Money precision (4 decimal places)
- Export configuration (batch size, thresholds)
- Pagination limits
- Validation rules

## ⚡ Performance

### Optimizations

- ✅ **Server-side Processing**: Pagination, sorting, filtering done on backend
- ✅ **Debounced Search**: 300ms debounce reduces API calls
- ✅ **React Memoization**: `React.memo`, `useCallback`, `useMemo` for expensive operations
- ✅ **Request Cancellation**: `AbortController` cancels in-flight requests
- ✅ **Worker Threads**: CSV generation offloaded to worker threads
- ✅ **Batch Processing**: Large exports processed in batches (500 records)
- ✅ **Database Indexes**: Optimized queries with compound indexes
- ✅ **Lazy Loading**: Dynamic imports for code splitting

### Performance Metrics

- **Initial Load**: < 2s (with optimized bundles)
- **API Response Time**: < 100ms (typical queries)
- **CSV Export**: < 5s for 10K records (with worker threads)

## 🔒 Security

### Current Security Measures

- ✅ **Input Validation**: DTOs with class-validator
- ✅ **CORS Configuration**: Environment-aware (restricted in production)
- ✅ **Error Handling**: No sensitive data in error messages
- ✅ **Atomic Updates**: Prevents race conditions in balance updates
- ✅ **Environment Variables**: Validation on startup

## 🚀 Enhancements and Future Scope

The following features are planned for future releases to enhance the application's functionality, security, and performance:

### 1. Authentication and Authorization

**Current Status**: Not implemented (out of scope for initial release)

**Planned Features**:
- User authentication with JWT tokens
- Role-based access control (RBAC)
- Multi-user wallet support
- Session management
- Password reset functionality
- OAuth integration (Google, etc.)
- API key management for programmatic access

**Benefits**:
- Secure multi-user access
- Personal wallet isolation
- Audit trails for user actions
- Enhanced security for production deployments

### 2. Date Range Based Transactions Export

**Current Status**: Export includes all transactions for a wallet

**Planned Features**:
- Date range picker in export UI
- Filter transactions by custom date ranges
- Export only transactions within selected period
- Support for multiple date range formats (presets: Last 7 days, Last 30 days, Last 90 days, Custom range)
- Export metadata including date range in CSV header
- Bulk export with date range filters

**Benefits**:
- More granular export control
- Reduced file sizes for large datasets
- Better compliance with data retention policies
- Improved user experience for financial reporting

### 3. Caching Layer with Redis

**Current Status**: Direct database queries for all operations

**Planned Features**:
- Redis integration for caching frequently accessed data
- Cache wallet summaries and balances
- Cache transaction lists with TTL
- Cache invalidation strategies (write-through, write-behind)
- Distributed caching for multi-instance deployments
- Cache warming strategies
- Redis cluster support for high availability

**Benefits**:
- Reduced database load
- Faster response times for read-heavy operations
- Better scalability for high-traffic scenarios
- Improved user experience with instant data retrieval
- Cost optimization by reducing database queries

**Implementation Considerations**:
- Cache key naming conventions
- TTL configuration per data type
- Cache invalidation on write operations
- Fallback to database on cache misses
- Monitoring and metrics for cache hit rates
