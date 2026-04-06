# VaultMaster Backend Server

The VaultMaster backend is a Node.js Express server with NeDB database that provides encrypted password storage and synchronization capabilities.

## Architecture

### Zero-Knowledge Design
- **All encryption happens client-side** - The server never has access to unencrypted passwords
- **Encrypted data storage** - Only encrypted blobs are stored in the NeDB database
- **Metadata separation** - Non-sensitive metadata (category, favorite status) is stored separately for efficient querying
- **Client-side decryption** - The frontend decrypts all data after retrieval

### Database (NeDB)
- **Embedded NoSQL database** - No external database dependencies
- **Persistent file-based storage** - Data stored in `./db/vaults.db`
- **Per-user isolation** - All data is tagged with userId for complete isolation
- **Automatic indexing** - Built-in support for efficient queries

### API Structure
- **RESTful endpoints** - Standard HTTP methods (GET, POST, PUT, DELETE)
- **User authentication** - Simple userId-based authentication (production should use JWT)
- **CORS enabled** - Supports frontend on different origin
- **JSON request/response** - All data transferred as JSON

## Installation

### Prerequisites
- Node.js 16+ (recommended: 18 LTS)
- npm 8+

### Setup

1. **Install dependencies**
```bash
cd server
npm install --legacy-peer-deps
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your settings
```

3. **Create database directory**
```bash
mkdir -p db
```

## Configuration

### Environment Variables

Create a `.env` file in the server directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# Database
DB_PATH=./db/vaults.db

# Security
ENCRYPTION_ON_CLIENT=true

# API
API_TIMEOUT=30000
MAX_REQUEST_SIZE=10mb

# Logging
LOG_LEVEL=info
```

## Running the Server

### Development Mode
```bash
npm run dev
```
- Runs with nodemon for auto-reload
- Logs all HTTP requests
- Shows stack traces on errors

### Production Mode
```bash
NODE_ENV=production npm start
```

### Both Frontend and Backend
From the root project directory:
```bash
npm run dev:full
```

## API Endpoints

### Authentication
All endpoints require `x-user-id` header or query parameter.

### Vault Entries

#### GET `/entries`
Get all entries for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": [...],
  "count": 10
}
```

#### GET `/entries/:id`
Get a specific entry by ID.

**Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

#### POST `/entries`
Create a new vault entry.

**Request Body:**
```json
{
  "encryptedData": "base64-encrypted-blob",
  "iv": "initialization-vector",
  "salt": "key-derivation-salt",
  "category": "login",
  "isFavorite": false,
  "passwordStrength": 85,
  "lastModifiedBy": "web"
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Entry created successfully"
}
```

#### PUT `/entries/:id`
Update an existing entry.

**Request Body:** (any combination of fields)
```json
{
  "category": "banking",
  "isFavorite": true,
  "passwordStrength": 90
}
```

#### DELETE `/entries/:id`
Delete an entry.

**Response:**
```json
{
  "success": true,
  "message": "Entry deleted successfully"
}
```

### Synchronization

#### POST `/sync`
Sync multiple entries at once (for bulk updates).

**Request Body:**
```json
{
  "entries": [...],
  "lastSync": "2024-01-01T00:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "syncResults": [
    { "id": "uuid", "status": "created" },
    { "id": "uuid", "status": "updated" },
    { "id": "uuid", "status": "skipped" }
  ],
  "data": [...],
  "lastSync": "2024-01-01T12:30:00Z"
}
```

#### POST `/import`
Bulk import entries (restore from backup).

**Request Body:**
```json
{
  "entries": [...]
}
```

#### GET `/export`
Export all entries for backup (encrypted).

**Response:**
```json
{
  "success": true,
  "data": [...],
  "count": 10,
  "exportedAt": "2024-01-01T12:30:00Z",
  "format": "encrypted"
}
```

### Metadata

#### GET `/stats`
Get vault statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 15,
    "categories": 5,
    "favorites": 3,
    "avgPasswordStrength": 82,
    "lastModified": "2024-01-01T12:30:00Z"
  }
}
```

#### GET `/categories`
Get all categories used in vault.

**Response:**
```json
{
  "success": true,
  "data": ["login", "banking", "email", ...],
  "count": 5
}
```

#### GET `/favorites`
Get all favorite entries.

**Response:**
```json
{
  "success": true,
  "data": [...],
  "count": 3
}
```

#### DELETE `/clear`
Clear all vault entries (requires `x-confirm-delete: true` header).

**Headers:**
```
x-confirm-delete: true
```

**Response:**
```json
{
  "success": true,
  "message": "Vault cleared successfully"
}
```

### Health

#### GET `/health`
Health check endpoint.

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "message": "Vault API is running"
}
```

## Database Schema

### VaultEntry Collection

```javascript
{
  id: String,                    // UUID
  userId: String,                // User identifier
  encryptedData: String,         // Base64 encrypted blob
  iv: String,                    // Initialization vector
  salt: String,                  // Key derivation salt
  category: String,              // login, email, banking, etc.
  isFavorite: Boolean,           // Favorite status
  passwordStrength: Number,      // 0-100
  createdAt: Date,               // Creation timestamp
  updatedAt: Date,               // Last update timestamp
  lastModifiedBy: String         // 'web', 'mobile', 'sync', etc.
}
```

## Security Considerations

### What is Encrypted
- Password
- Username
- Email
- Notes
- Any sensitive data

### What is NOT Encrypted
- Category (needed for filtering)
- Favorite status (for quick access)
- Password strength score (computed client-side)
- Timestamps (for sync)

### Best Practices
1. **HTTPS Only** - Always use HTTPS in production
2. **User Authentication** - Implement JWT authentication instead of simple userId
3. **Rate Limiting** - Add rate limiting to prevent abuse
4. **CORS Restrictions** - Limit CORS origins to your frontend domain
5. **Database Backup** - Regularly backup the `db/` directory
6. **Environment Variables** - Never commit `.env` file

## Development

### File Structure
```
server/
├── db/                    # NeDB database (auto-created)
├── models/
│   └── VaultEntry.js      # Database model
├── routes/
│   └── vault.js           # API routes
├── index.js               # Server entry point
├── package.json
├── .env.example
└── .gitignore
```

### Adding New Endpoints

1. **Add model method** in `models/VaultEntry.js`:
```javascript
export const VaultEntry = {
  newMethod: async (userId, data) => {
    return promisify((callback) => {
      // NeDB operation
    });
  }
};
```

2. **Add route** in `routes/vault.js`:
```javascript
router.post('/new-endpoint', async (req, res) => {
  try {
    const result = await VaultEntry.newMethod(req.userId, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### Testing Endpoints

Using curl:
```bash
# Get all entries
curl -H "x-user-id: user-123" http://localhost:3001/api/vault/entries

# Create entry
curl -X POST \
  -H "x-user-id: user-123" \
  -H "Content-Type: application/json" \
  -d '{"encryptedData": "...", "iv": "...", "salt": "...", "category": "login"}' \
  http://localhost:3001/api/vault/entries
```

## Deployment

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### Environment Setup for Production
1. Set `NODE_ENV=production`
2. Use a process manager (PM2, systemd, etc.)
3. Configure CORS for your frontend domain
4. Use HTTPS with valid certificate
5. Implement JWT authentication
6. Add database backups
7. Monitor server logs
8. Set up error tracking (Sentry, etc.)

## Troubleshooting

### Port Already in Use
```bash
lsof -i :3001  # Find process
kill -9 <PID>  # Kill process
```

### Database Errors
- Delete `db/vaults.db` and restart (WARNING: loses all data)
- Check file permissions on `db/` directory

### CORS Errors
- Verify `CORS_ORIGIN` includes your frontend URL
- Check browser console for detailed error

### Connection Refused
- Ensure server is running: `npm run dev`
- Check `PORT` environment variable
- Verify firewall allows the port

## License

MIT

## Support

For issues and questions, please refer to:
- Frontend Documentation: `../README.md`
- API Documentation: This file
- GitHub Issues: https://github.com/TheKidBaby/Ctrl-build-projects/issues