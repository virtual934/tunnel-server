# Tunnel Server

A WebSocket-based HTTP tunnel server that forwards incoming HTTP requests through connected tunnel clients.

## Features

- **WebSocket Tunneling**: Connects clients via WebSocket to relay HTTP requests
- **HTTP Forwarding**: Accepts HTTP requests and forwards them through connected tunnels
- **Request Timeout**: 30-second timeout for tunnel responses
- **Multiple Clients**: Manages multiple tunnel connections
- **Error Handling**: Returns appropriate HTTP status codes for disconnected or timed-out tunnels

## Setup

### Installation

```bash
npm install
```

### Environment Variables

- `WS_PORT` or `PORT`: WebSocket server port (default: 3001)
- `HTTP_PORT`: HTTP server port (default: 8080)

**Note**: On Render, both WebSocket and HTTP servers run on the same port.

## Usage

### Starting the Server

```bash
npm start
```

The server will listen on the configured ports and await tunnel client connections.

### Tunnel Connection

Connect a tunnel client to `/tunnel` endpoint:

```javascript
const ws = new WebSocket('ws://localhost:3001/tunnel');
```

### HTTP Request Flow

1. Client sends HTTP request to the server
2. Server forwards request through connected tunnel client via WebSocket
3. Tunnel client processes request and sends response back
4. Server returns response to original HTTP client

## Response Codes

- `502 Bad Gateway`: No tunnel client connected
- `504 Gateway Timeout`: Tunnel response not received within 30 seconds
- `200+`: Response from tunnel client

## Architecture

- **HTTP Server**: Accepts incoming HTTP requests
- **WebSocket Server**: Manages tunnel client connections
- **Request Queue**: Maintains pending requests with timeout handling
- **Tunnel Pool**: Tracks active tunnel connections

## License

MIT
