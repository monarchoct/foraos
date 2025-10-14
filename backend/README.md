# HEART Backend Server

Secure backend API for the HEART AI Companion with user authentication and persistent memory storage.

## 🚀 Features

- **User Authentication**: JWT-based login/register
- **Secure Memory Storage**: User-isolated conversation history
- **SQLite Database**: Lightweight, file-based database
- **Rate Limiting**: Protection against abuse
- **CORS Enabled**: Frontend integration ready

## 📦 Installation

```bash
cd backend
npm install
```

## 🔧 Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Create data directory**:
   ```bash
   mkdir data
   ```

3. **Start the server**:
   ```bash
   # Development (with auto-restart)
   npm run dev
   
   # Production
   npm start
   ```

## 🔌 API Endpoints

### Authentication

#### Register User
```http
POST /api/register
Content-Type: application/json

{
  "username": "user123",
  "email": "user@example.com",
  "password": "securepassword"
}
```

#### Login User
```http
POST /api/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### Memory Storage

#### Save Memory
```http
POST /api/memory
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "conversationHistory": [...],
  "emotionalHistory": [...],
  "sessionStart": "2025-08-02T00:49:10.234Z",
  "totalMessages": 5
}
```

#### Get Memory
```http
GET /api/memory
Authorization: Bearer <jwt_token>
```

### Health Check
```http
GET /api/health
```

## 🛡️ Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: 7-day expiration
- **Rate Limiting**: 100 requests per 15 minutes
- **CORS Protection**: Configured for frontend
- **SQL Injection Protection**: Parameterized queries

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Memories Table
```sql
CREATE TABLE memories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  conversation_history TEXT,
  emotional_history TEXT,
  last_saved DATETIME DEFAULT CURRENT_TIMESTAMP,
  session_start DATETIME,
  total_messages INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

## 🔧 Environment Variables

```bash
PORT=3001                    # Server port
JWT_SECRET=your-secret-key   # JWT signing secret
```

## 📁 File Structure

```
backend/
├── server.js          # Main server file
├── package.json       # Dependencies
├── README.md         # This file
└── data/
    └── heart.db      # SQLite database (auto-created)
```

## 🔗 Frontend Integration

Update your frontend to use the backend API:

```javascript
// Example: Save memory
const response = await fetch('http://localhost:3001/api/memory', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`
  },
  body: JSON.stringify(memoryData)
});
```

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Environment Setup
```bash
export JWT_SECRET="your-super-secure-secret-key"
export PORT=3001
```

## 🔍 Troubleshooting

### Common Issues

1. **Port already in use**: Change PORT in environment
2. **Database errors**: Check data directory permissions
3. **CORS errors**: Verify frontend URL in CORS config
4. **JWT errors**: Check JWT_SECRET environment variable

### Logs
- Server logs show API requests
- Database errors are logged
- Rate limiting violations are logged

## 📈 Monitoring

- Health check endpoint: `GET /api/health`
- Database file: `backend/data/heart.db`
- Server logs: Console output 