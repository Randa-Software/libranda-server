export class ReplyManager {
    constructor() {
        this.replies = new Map(); // namespace -> Map(event -> Set(callbacks))
    }

    /**
     * Register an event handler for a specific namespace and event
     * @param {string} namespace - Event namespace
     * @param {string} event - Event name
     * @param {function} callback - Event handler callback
     * @returns {function} Cleanup function to unregister the handler
     */
    registerReply(namespace, event, callback) {
        if (!this.replies.has(namespace)) {
            this.replies.set(namespace, new Map());
        }
        const namespaceHandlers = this.replies.get(namespace);

        if (!namespaceHandlers.has(event)) {
            namespaceHandlers.set(event, new Set());
        }
        const eventCallbacks = namespaceHandlers.get(event);

        eventCallbacks.add(callback);
        return () => {
            const handlers = this.replies.get(namespace)?.get(event);
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
    handleReply(namespace, event, data) {
        console.log(`Received reply for event ${event} in namespace ${namespace}:`, data);
        const namespaceHandlers = this.replies.get(namespace);
        if (!namespaceHandlers) return;

        const eventCallbacks = namespaceHandlers.get(event);
        if (!eventCallbacks) return;

        const { clientId, metadata, ip, reply_id, ...cleanData } = data;
        const clientInfo = { id: clientId, metadata: metadata, ip: ip };
        console.log(eventCallbacks)

        for (const callback of eventCallbacks) {
            try {
                return callback(clientInfo, cleanData);
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
        this.replies.clear();
    }
}
