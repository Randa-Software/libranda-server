export class EventManager {
    constructor() {
        this.eventHandlers = new Map(); // namespace -> Map(event -> Set(callbacks))
    }

    /**
     * Register an event handler for a specific namespace and event
     * @param {string} namespace - Event namespace
     * @param {string} event - Event name
     * @param {function} callback - Event handler callback
     * @returns {function} Cleanup function to unregister the handler
     */
    registerEvent(namespace, event, callback) {
        if (!this.eventHandlers.has(namespace)) {
            this.eventHandlers.set(namespace, new Map());
        }
        const namespaceHandlers = this.eventHandlers.get(namespace);

        if (!namespaceHandlers.has(event)) {
            namespaceHandlers.set(event, new Set());
        }
        const eventCallbacks = namespaceHandlers.get(event);

        eventCallbacks.add(callback);
        return () => {
            const handlers = this.eventHandlers.get(namespace)?.get(event);
            if (handlers) {
                handlers.delete(callback);
            }
        };
    }

    /**
     * Handle an incoming event
     * @param {string} namespace - Event namespace
     * @param {string} event - Event name
     * @param {any} data - Event data
     */
    handleEvent(namespace, event, data) {
        const namespaceHandlers = this.eventHandlers.get(namespace);
        if (!namespaceHandlers) return;

        const eventCallbacks = namespaceHandlers.get(event);
        if (!eventCallbacks) return;

        const { clientId, metadata, ...cleanData } = data;
        const clientInfo = { id: clientId, metadata: metadata };

        for (const callback of eventCallbacks) {
            try {
                callback(clientInfo, cleanData);
            } catch (err) {
                console.error(
                    `Error in event handler (${namespace}:${event}):`,
                    err,
                );
            }
        }
    }

    /**
     * Clear all event handlers
     */
    clear() {
        this.eventHandlers.clear();
    }
}
