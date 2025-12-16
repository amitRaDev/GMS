# Smart Garage Management System

ANPR-based garage management system with real-time monitoring, job card tracking, and gate event logging.

## Features

- 🚗 ANPR camera integration for automatic vehicle detection
- 📋 Job card management with status workflow (IDLE → ONGOING → TEST_DRIVE → COMPLETED → CLOSED)
- 🚪 Gate entry/exit popup confirmations
- 📊 Real-time dashboard with WebSocket events
- 📜 Gate history with pagination and filtering
- 🌙 Dark mode support
- 💾 IndexedDB for offline event storage (500 event limit)
- 📱 PWA ready

## Tech Stack

- **Backend**: NestJS, TypeORM, MySQL, Socket.IO
- **Frontend**: Angular 19, Tailwind CSS, RxJS
- **Database**: MySQL

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Start both backend and frontend
npm start
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start both backend and frontend |
| `npm run start:backend` | Start backend only (dev mode) |
| `npm run start:frontend` | Start frontend only |
| `npm run build` | Build both projects |
| `npm run install:all` | Install all dependencies |

## Configuration

### Environment Variables (.env)

```env
BACKEND_PORT=3000
FRONTEND_PORT=4200
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=new_user
DB_PASSWORD=password
DB_DATABASE=smart_garage
```

### Application Config (config.json)

Contains CORS settings, Swagger config, WebSocket options, and other app settings.

## API Documentation

Swagger docs available at: http://localhost:3000/docs

## URLs

- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:3000/api
- **Swagger Docs**: http://localhost:3000/docs
