# libranda-server

A robust WebSocket and HTTP server library for building real-time applications and services.

[📚 View Full Documentation](./docs.md) | [🚀 View Examples](https://github.com/Randa-Software/libranda-examples)

## Features

- Combined HTTP and WebSocket server
- Plugin system for extensibility
- Event-based communication
- Client metadata management
- Static file serving
- Client management and tracking
- Namespaced events

## Installation

```bash
npm install libranda-server
```

## Quick Start

```typescript
import { startService, setServicePort, setHttpPublicDir, registerEvent } from 'libranda-server';

// Set the port for both HTTP and WebSocket servers
setServicePort(3000);

// Set directory for serving static files
setHttpPublicDir('./public');

// Register an event handler
const cleanup = registerEvent('chat', 'message', (data) => {
    console.log('Received chat message:', data);
});

// Start the service
await startService();
```

## Documentation

For detailed API documentation, advanced usage, and best practices, see the [documentation](./docs.md).

For working examples and sample implementations, visit our [examples repository](https://github.com/Randa-Software/libranda-examples).


## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
