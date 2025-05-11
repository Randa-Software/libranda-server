declare module "libranda-server" {
    export interface PluginInterface {
        /**
         * Register an event handler for a specific namespace and event
         * @param namespace Event namespace
         * @param event Event name
         * @param callback Event handler callback
         * @returns Cleanup function to unregister the handler
         */
        registerEvent(
            namespace: string,
            event: string,
            callback: (data: any) => void,
        ): () => void;

        /**
         * Get the current number of connected clients
         * @returns Number of connected clients
         */
        getConnectedClients(): number;

        /**
         * Get array of connected client IDs
         * @returns Array of client IDs
         */
        getConnectedClientIds(): string[];

        /**
         * Emit an event to a specific client
         * @param clientIdOrClient Client ID or object with id property
         * @param namespace Event namespace
         * @param event Event name
         * @param data Event data
         */
        emitEvent(
            clientIdOrClient: string | { id: string },
            namespace: string,
            event: string,
            data: any,
        ): void;

        /**
         * Get metadata associated with a client
         * @param clientId Client ID
         * @returns Client metadata or null if not found
         */
        getClientMetadata(clientId: string): any | null;

        /**
         * Set metadata for a client
         * @param clientId Client ID
         * @param metadata Metadata to store
         */
        setClientMetadata(clientId: string, metadata: any): void;
    }

    export interface Plugin {
        /** Unique identifier for the plugin */
        id: string;
        /** Optional initialization function */
        initialize?(api: PluginInterface): void;
        /** Optional cleanup function */
        cleanup?(): void;
    }

    /**
     * Register an event handler for a specific namespace and event
     * @param namespace Event namespace
     * @param event Event name
     * @param callback Event handler callback
     * @returns Cleanup function to unregister the handler
     */
    export function registerEvent(
        namespace: string,
        event: string,
        callback: (data: any) => void,
    ): () => void;

    /**
     * Sets the directory for serving static files
     * @param dir Directory path
     */
    export function setHttpPublicDir(dir: string): void;

    /**
     * Sets the port for both HTTP and WebSocket servers
     * @param port Port number
     */
    export function setServicePort(port: number): void;

    /**
     * Get the current service port
     * @returns Port number
     */
    export function getServicePort(): number;

    /**
     * Starts the service (HTTP + WebSocket servers)
     * @returns Promise that resolves when the service is started
     */
    export function startService(): Promise<void>;

    /**
     * Stops the service
     * @returns Promise that resolves when the service is stopped
     */
    export function stopService(): Promise<void>;

    /**
     * Register a plugin with the service
     * @param plugin Plugin instance to register
     * @returns Cleanup function to unregister the plugin
     */
    export function registerPlugin(plugin: Plugin): () => void;

    /**
     * Get all registered plugins
     * @returns Array of registered plugin instances
     */
    export function getPlugins(): Plugin[];

    /**
     * Send a message to all connected WebSocket clients
     * @param message Message to broadcast
     */
    export function broadcast(message: any): void;

    /**
     * Get the current number of connected clients
     * @returns Number of connected clients
     */
    export function getConnectedClients(): number;

    /**
     * Get array of connected client IDs
     * @returns Array of client IDs
     */
    export function getConnectedClientIds(): string[];

    /**
     * Emit an event to a specific client
     * @param clientIdOrClient Client ID or object with id property
     * @param namespace Event namespace
     * @param event Event name
     * @param data Event data
     */
    export function emitEvent(
        clientIdOrClient: string | { id: string },
        namespace: string,
        event: string,
        data: any,
    ): void;

    /**
     * Get metadata associated with a client
     * @param clientId Client ID
     * @returns Client metadata or null if not found
     */
    export function getClientMetadata(clientId: string): any | null;

    /**
     * Set metadata for a client
     * @param clientId Client ID
     * @param metadata Metadata to store
     */
    export function setClientMetadata(clientId: string, metadata: any): void;
}
