import { WebSocketServer as WS } from "ws";
import { randomUUID } from "crypto";
import * as state from "../state.js";

export class WebSocketServer {
    constructor() {
        this.wss = null;
        this.clients = new Map(); // clientId -> { ws, metadata }
        this.heartbeatInterval = null;
        this.HEARTBEAT_INTERVAL = 30000; // 30 seconds
        this.HEARTBEAT_TIMEOUT = 60000;  // 60 seconds - time to wait for pong
    }

    /**
     * Initialize the WebSocket server with an HTTP server
     * @param {import('http').Server} httpServer - HTTP server instance
     */
    initialize(httpServer) {
        this.wss = new WS({ server: httpServer });
        this.setupEventHandlers();
        this.startHeartbeat();
    }

    startHeartbeat() {
        // Clear any existing interval
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        this.heartbeatInterval = setInterval(() => {
            this.clients.forEach((client, clientId) => {
                if (client.ws.isAlive === false) {
                    console.log(`Client ${clientId} failed heartbeat, terminating connection`);
                    client.ws.terminate();
                    return;
                }

                client.ws.isAlive = false;
                try {
                    client.ws.ping();
                } catch (err) {
                    console.error(`Error sending ping to client ${clientId}:`, err);
                    client.ws.terminate();
                }
            });
        }, this.HEARTBEAT_INTERVAL);
    }

    /**
     * Set up WebSocket event handlers
     */
    setupEventHandlers() {
        this.wss.on("connection", (ws, req) => {
            const clientId = randomUUID();
            ws.isAlive = true; // Initialize the isAlive flag

            // Set up pong handler
            ws.on("pong", () => {
                ws.isAlive = true;
            });

            this.clients.set(clientId, { ws, metadata: {} });
            const clientIp =
                req.socket.remoteAddress ||
                req.connection.remoteAddress ||
                req.headers["x-forwarded-for"]?.split(",")[0] ||
                "unknown";
            this.clients.set(clientId, { ws, metadata: {}, ip: clientIp });

            // Send the client their ID
            this.sendToClient(clientId, {
                namespace: "system",
                event: "init",
                data: { clientId },
            });

            ws.on("message", (message) => {
                try {
                    const parsedMessage = JSON.parse(message.toString());
                    const { namespace, event, data, reply_id } = parsedMessage;

                    // Augment the event data with client information
                    const client = this.clients.get(clientId);
                    let augmentedData = {
                        ...data,
                        clientId: clientId,
                        metadata: client?.metadata,
                        ip: client?.ip,
                    };

                    if (reply_id) {
                        // Use ReplyManager for messages with reply_id
                        augmentedData.reply_id = reply_id;
                        this.emitEvent(clientId, namespace, event, state
                            .getReplyManager()
                            .handleReply(namespace, event, augmentedData), reply_id);
                    } else {
                        // Use EventManager for regular events
                        state
                            .getEventManager()
                            .handleEvent(namespace, event, augmentedData);
                    }
                } catch (err) {
                    console.error("Failed to parse WebSocket message:", err);
                }
            });

            ws.on("close", () => {
                this.clients.delete(clientId);
                state
                    .getEventManager()
                    .handleEvent("system", "client-disconnected", { clientId });
            });

            ws.on("error", (error) => {
                console.error("WebSocket client error:", error);
                this.clients.delete(clientId);
            });

            // Notify about new client connection
            state
                .getEventManager()
                .handleEvent("system", "client-connected", { clientId });
        });

        this.wss.on("error", (error) => {
            console.error("WebSocket server error:", error);
        });
    }

    /**
     * Get the number of connected clients
     * @returns {number} Number of connected clients
     */
    getConnectedClients() {
        return this.clients.size;
    }

    /**
     * Get all connected client IDs
     * @returns {string[]} Array of client IDs
     */
    getClientIds() {
        return Array.from(this.clients.keys());
    }

    /**
     * Set metadata for a specific client
     * @param {string} clientId - Client ID
     * @param {Object} metadata - Metadata to store
     */
    setClientMetadata(clientId, metadata) {
        const client = this.clients.get(clientId);
        if (client) {
            client.metadata = { ...client.metadata, ...metadata };
        }
    }

    /**
     * Get metadata for a specific client
     * @param {string} clientId - Client ID
     * @returns {Object} Client metadata
     */
    getClientMetadata(clientId) {
        return this.clients.get(clientId)?.metadata || {};
    }

    /**
     * Get IP address for a specific client
     * @param {string} clientId - Client ID
     * @returns {string} Client IP address
     */
    getClientIp(clientId) {
        return this.clients.get(clientId)?.ip || "unknown";
    }

    /**
     * Send a message to a specific client
     * @param {string} clientId - Target client ID
     * @param {Object} message - Message to send
     * @returns {boolean} Success status
     */
    sendToClient(clientId, message) {
        const client = this.clients.get(clientId);

        if (!client || client.ws.readyState !== 1) {
            return false;
        }

        try {
            const messageStr =
                typeof message === "string" ? message : JSON.stringify(message);
            client.ws.send(messageStr);
            return true;
        } catch (err) {
            console.error("Error sending to client:", err);
            this.clients.delete(clientId);
            return false;
        }
    }

    /**
     * Emit an event to specific clients
     * @param {string|string[]} clientIds - Target client ID(s)
     * @param {string} namespace - Event namespace
     * @param {string} event - Event name
     * @param {any} data - Event data
     */
    emitEvent(clientIds, namespace, event, data, reply_id = null) {
        console.log(`Emitting event ${event} to ${clientIds}, ${reply_id}`);
        const message = {
            namespace,
            event,
            data,
            ...(reply_id !== null && { reply_id })
        };

        if (clientIds === "*") {
            this.broadcast(message);
        } else {
            const ids = Array.isArray(clientIds) ? clientIds : [clientIds];
            ids.forEach((clientId) => this.sendToClient(clientId, message));
        }
    }

    /**
     * Broadcast a message to all connected clients
     * @param {any} message - Message to broadcast
     */
    broadcast(message) {
        const messageStr =
            typeof message === "string" ? message : JSON.stringify(message);
        for (const [clientId, client] of this.clients) {
            if (client.ws.readyState === 1) {
                try {
                    client.ws.send(messageStr);
                } catch (err) {
                    console.error("Error broadcasting to client:", err);
                    this.clients.delete(clientId);
                }
            }
        }
    }

    /**
     * Close the WebSocket server and clean up
     */
    close() {
        if (this.wss) {
            // Clear the heartbeat interval
            if (this.heartbeatInterval) {
                clearInterval(this.heartbeatInterval);
                this.heartbeatInterval = null;
            }

            for (const [_, client] of this.clients) {
                client.ws.terminate();
            }
            this.clients.clear();
            this.wss.close();
            this.wss = null;
        }
    }
}
