# Libranda Server Technical Documentation

## Architecture Overview

Libranda Server provides a unified solution for HTTP and WebSocket communication, with a plugin-based architecture for extensibility. The server handles both static file serving and real-time bidirectional communication.

## Core Components

### Service Management

#### Port Configuration
```typescript
setServicePort(port: number): void
getServicePort(): number
```
Controls the port configuration for both HTTP and WebSocket servers. Both services run on the same port for simplified deployment.

#### Service Lifecycle
```typescript
startService(): Promise<void>
stopService(): Promise<void>
```
Manages the lifecycle of the server. The start operation is asynchronous and resolves when both HTTP and WebSocket servers are ready.

#### Static File Serving
```typescript
setHttpPublicDir(dir: string): void
```
Configures the directory for serving static files through the HTTP server.

#### Serve Single Page Application (SPA)
```typescript
setHttpPublicSinglePage(bool: boolean): void
```
Configures the HTTP server to serve a single page application. If set to `true`, all routes will redirect to the index file, typically used for SPAs.


### Event System

#### Event Registration
```typescript
registerEvent(
    namespace: string,
    event: string,
    callback: (data: any) => void
): () => void
```
- **namespace**: Logical grouping for related events
- **event**: Specific event identifier
- **callback**: Handler function receiving event data
- **returns**: Cleanup function to unregister the handler

#### Event Broadcasting
```typescript
broadcast(message: any): void
```
Sends a message to all connected WebSocket clients.

#### Targeted Events
```typescript
emitEvent(
    clientIdOrClient: string | { id: string },
    namespace: string,
    event: string,
    data: any
): void
```
Sends an event to a specific client identified by ID or client object.

### Client Management

#### Client Tracking
```typescript
getConnectedClients(): number
getConnectedClientIds(): string[]
```
Provides information about connected clients.

#### Client Metadata
```typescript
getClientMetadata(clientId: string): any | null
setClientMetadata(clientId: string, metadata: any): void
```
Manages arbitrary metadata associated with connected clients.

## Plugin System

### Plugin Interface
```typescript
interface Plugin {
    id: string;
    initialize?(api: PluginInterface): void;
    cleanup?(): void;
}
```

### Plugin API
```typescript
interface PluginInterface {
    registerEvent(namespace: string, event: string, callback: (data: any) => void): () => void;
    getConnectedClients(): number;
    getConnectedClientIds(): string[];
    emitEvent(clientIdOrClient: string | { id: string }, namespace: string, event: string, data: any): void;
    getClientMetadata(clientId: string): any | null;
    setClientMetadata(clientId: string, metadata: any): void;
}
```

### Plugin Management
```typescript
registerPlugin(plugin: Plugin): () => void
getPlugins(): Plugin[]
```

## Best Practices

### Event Namespacing
- Use descriptive namespace names to organize events logically
- Consider using dot notation for nested namespaces (e.g., "chat.private")
- Keep namespace and event names consistent across your application

### Client Metadata
- Store lightweight, frequently accessed data
- Consider cleanup strategies for stale metadata
- Use structured data formats for consistency

### Plugin Development
1. Implement proper cleanup in plugin's cleanup method
2. Use type-safe metadata structures
3. Handle plugin initialization failures gracefully
4. Avoid circular plugin dependencies

## Security Considerations

1. **Client Authentication**
   - Implement authentication before allowing WebSocket connections
   - Use secure tokens for client identification

2. **Input Validation**
   - Validate all event data
   - Sanitize file paths for static serving
   - Implement rate limiting for events

3. **Error Handling**
   - Never expose internal errors to clients
   - Log errors securely
   - Implement proper error boundaries

## Performance Tips

1. **Event Handling**
   - Keep event callbacks lightweight
   - Avoid blocking operations in event handlers
   - Use debouncing for frequent events

2. **Resource Management**
   - Implement proper cleanup for unused event listeners
   - Monitor memory usage with large numbers of clients
   - Consider client connection limits

3. **Static File Serving**
   - Use appropriate caching headers
   - Consider using a CDN for static assets
   - Compress static files

## Troubleshooting

### Common Issues

1. **Connection Problems**
   - Verify port availability
   - Check firewall settings
   - Ensure proper WebSocket handshake

2. **Event Handling Issues**
   - Verify namespace and event names
   - Check event handler registration
   - Monitor event queue size

3. **Plugin Errors**
   - Validate plugin interface implementation
   - Check for plugin conflicts
   - Ensure proper cleanup execution

## API Type Reference

Include type definitions for custom data structures and consider type safety in your implementation:

```typescript
type ClientId = string;
type Namespace = string;
type EventName = string;
type CleanupFunction = () => void;

interface ClientMetadata {
    [key: string]: any;
}
```

## Error Reference

Common error scenarios and their resolutions:

1. **Port Already in Use**
   - Error: EADDRINUSE
   - Resolution: Choose different port or stop competing service

2. **Invalid Static Directory**
   - Error: ENOENT
   - Resolution: Verify directory path and permissions

3. **Plugin Registration Failure**
   - Error: Duplicate plugin ID
   - Resolution: Ensure unique plugin IDs
