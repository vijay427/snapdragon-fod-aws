# MCP HTTP Bridge

HTTP Bridge that exposes the Snapdragon Digital Chassis MCP Simulator as a REST API, enabling AWS Lambda functions to communicate with the local simulator during development and testing.

## Overview

The HTTP Bridge translates REST API calls into MCP protocol tool invocations, allowing cloud-deployed Lambda functions to interact with the locally-running Snapdragon simulator without requiring IoT Core infrastructure.

## Installation

```bash
cd mcp-servers/http-bridge
npm install
```

## Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

### Environment Variables

- `PORT` - Server port (default: 3001)
- `MCP_SERVER_PATH` - Path to MCP simulator (default: ../snapdragon-simulator)
- `CORS_ORIGINS` - Allowed CORS origins (default: *)
- `API_KEY` - Optional API key for authentication
- `LOG_LEVEL` - Logging level: debug, info, warn, error (default: info)
- `REQUEST_TIMEOUT_MS` - Request timeout in milliseconds (default: 30000)

## Usage

### Build

```bash
npm run build
```

### Start Server

```bash
npm start
```

### Development Mode

```bash
npm run dev
```

The server will start on `http://localhost:3001` (or your configured PORT).

## API Endpoints

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "mcpConnected": true,
  "uptime": 123.456,
  "timestamp": "2024-12-05T10:30:00.000Z"
}
```

### Activate Feature

```http
POST /api/vehicle/:vehicleId/activate
Content-Type: application/json

{
  "featureId": "SPORT_MODE",
  "duration": 48
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "vehicleId": "VIN1234567890",
    "featureId": "SPORT_MODE",
    "status": "ACTIVATED",
    "activatedAt": "2024-12-05T10:30:00.000Z",
    "expiresAt": "2024-12-07T10:30:00.000Z",
    "vehicleState": { ... }
  }
}
```

### Deactivate Feature

```http
POST /api/vehicle/:vehicleId/deactivate
Content-Type: application/json

{
  "featureId": "SPORT_MODE"
}
```

### Get Vehicle State

```http
GET /api/vehicle/:vehicleId/state
```

**Response:**
```json
{
  "success": true,
  "data": {
    "vehicleId": "VIN1234567890",
    "connectivityTier": "5G",
    "performanceMode": "SPORT",
    "activeFeatures": [
      {
        "featureId": "SPORT_MODE",
        "activatedAt": "2024-12-05T10:30:00.000Z",
        "expiresAt": "2024-12-07T10:30:00.000Z"
      }
    ],
    "simulatedTime": "2024-12-05T10:30:00.000Z"
  }
}
```

### Advance Time (Testing)

```http
POST /api/vehicle/:vehicleId/advance-time
Content-Type: application/json

{
  "hours": 24
}
```

### Reset Vehicle

```http
POST /api/vehicle/:vehicleId/reset
```

## Authentication

If `API_KEY` is configured, include it in the Authorization header:

```http
Authorization: Bearer your-api-key-here
```

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "correlationId": "req-123-abc"
  }
}
```

### Error Codes

- `VALIDATION_ERROR` (400) - Invalid request parameters
- `UNAUTHORIZED` (401) - Missing or invalid API key
- `ACTIVATION_FAILED` (500) - Feature activation failed
- `MCP_UNAVAILABLE` (503) - MCP server not connected
- `TIMEOUT` (504) - Request timeout

## Exposing to AWS Lambda

### Option 1: ngrok (Recommended for Development)

```bash
# Install ngrok
# https://ngrok.com/download

# Start bridge
npm start

# In another terminal, start ngrok
ngrok http 3001
```

Copy the ngrok URL (e.g., `https://abc123.ngrok.io`) and set it as the `HTTP_BRIDGE_URL` environment variable in your Lambda function.

### Option 2: localtunnel (Open Source)

```bash
# Install localtunnel
npm install -g localtunnel

# Start bridge
npm start

# In another terminal, start tunnel
lt --port 3001
```

### Option 3: Deploy to AWS

For production, deploy the bridge as:
- AWS Lambda with Function URL
- ECS/Fargate container
- EC2 instance

## Logging

The bridge uses structured JSON logging:

```json
{
  "timestamp": "2024-12-05T10:30:00.000Z",
  "level": "INFO",
  "message": "Feature activated",
  "correlationId": "req-123-abc",
  "vehicleId": "VIN1234567890",
  "featureId": "SPORT_MODE"
}
```

## Troubleshooting

### MCP Connection Failed

**Error:** `Failed to connect to MCP server`

**Solution:**
1. Ensure the Snapdragon simulator is built: `cd ../snapdragon-simulator && npm run build`
2. Check `MCP_SERVER_PATH` in `.env` points to the correct location
3. Verify Node.js version is 18.x or higher

### Port Already in Use

**Error:** `EADDRINUSE: address already in use`

**Solution:**
1. Change `PORT` in `.env` to a different port
2. Or stop the process using port 3001:
   ```bash
   # Windows
   netstat -ano | findstr :3001
   taskkill /PID <PID> /F
   
   # Linux/Mac
   lsof -ti:3001 | xargs kill
   ```

### CORS Errors

**Error:** `Access-Control-Allow-Origin` errors in browser

**Solution:**
1. Add your origin to `CORS_ORIGINS` in `.env`:
   ```
   CORS_ORIGINS=http://localhost:3000,https://your-app.com
   ```
2. Or use `*` for development (not recommended for production)

## Development

### Project Structure

```
http-bridge/
├── src/
│   ├── index.ts          # Main entry point
│   ├── server.ts         # Express server setup
│   ├── routes.ts         # API route handlers
│   ├── mcp-client.ts     # MCP client wrapper
│   ├── middleware.ts     # Express middleware
│   ├── logger.ts         # Structured logging
│   └── config.ts         # Configuration loader
├── dist/                 # Compiled JavaScript
├── package.json
├── tsconfig.json
└── .env
```

### Adding New Endpoints

1. Add route handler in `src/routes.ts`
2. Add MCP client method in `src/mcp-client.ts` if needed
3. Update this README with endpoint documentation

## License

MIT
