import http from "http";
import fs from "fs/promises";
import path from "path";
import { WebSocketServer } from "ws";

const DEFAULT_PORT = 3000;

// Storage structures
const eventHandlers = new Map(); // namespace -> Map(event -> Set(callbacks))
const plugins = new Map(); // pluginId -> plugin instance
let server = null;
let wss = null;
let publicDir = null;
let port = DEFAULT_PORT;
const clients = new Set();

// Plugin interface definition
const pluginInterface = {
    registerEvent,
    broadcast,
    getConnectedClients
};

export function registerEvent(namespace, event, callback) {
    if (!eventHandlers.has(namespace)) {
        eventHandlers.set(namespace, new Map());
    }
    const namespaceHandlers = eventHandlers.get(namespace);

    if (!namespaceHandlers.has(event)) {
        namespaceHandlers.set(event, new Set());
    }
    const eventCallbacks = namespaceHandlers.get(event);

    eventCallbacks.add(callback);
    return () => eventCallbacks.delete(callback);
}

export function setServicePort(newPort) {
    port = newPort;
}

export function getServicePort() {
    return port;
}

export function registerPlugin(plugin) {
    if (!plugin.id) {
        throw new Error('Plugin must have an id property');
    }
    if (plugins.has(plugin.id)) {
        throw new Error(`Plugin with id ${plugin.id} is already registered`);
    }
    
    plugins.set(plugin.id, plugin);
    if (typeof plugin.initialize === 'function') {
        plugin.initialize(pluginInterface);
    }
    
    return () => {
        if (typeof plugin.cleanup === 'function') {
            plugin.cleanup();
        }
        plugins.delete(plugin.id);
    };
}

export function setHttpPublicDir(dir) {
    publicDir = dir;
}

export function getConnectedClients() {
    return clients.size;
}

export function broadcast(message) {
    const messageStr =
        typeof message === "string" ? message : JSON.stringify(message);
    for (const client of clients) {
        if (client.readyState === WebSocketServer.OPEN) {
            client.send(messageStr);
        }
    }
}

export async function startService() {
    if (server) return;

    server = http.createServer(async (req, res) => {
        if (!publicDir) {
            res.writeHead(404);
            res.end("Not Found");
            return;
        }

        const reqPath = req.url === "/" ? "/index.html" : req.url;
        const fullPath = path.join(publicDir, reqPath);

        try {
            const content = await fs.readFile(fullPath);
            const ext = path.extname(fullPath).toLowerCase();
            const mimeTypes = {
                ".html": "text/html",
                ".js": "application/javascript",
                ".css": "text/css",
                ".json": "application/json",
                ".png": "image/png",
                ".jpg": "image/jpeg",
                ".jpeg": "image/jpeg",
                ".gif": "image/gif",
                ".svg": "image/svg+xml",
            };
            const contentType = mimeTypes[ext] || "text/plain";
            res.writeHead(200, { "Content-Type": contentType });
            res.end(content);
        } catch (err) {
            res.writeHead(404);
            res.end("Not Found");
        }
    });

    wss = new WebSocketServer({ server });

    wss.on("connection", (ws) => {
        clients.add(ws);

        ws.on("message", (message) => {
            try {
                const { namespace, event, data } = JSON.parse(
                    message.toString(),
                );

                // Handle events
                const namespaceHandlers = eventHandlers.get(namespace);
                if (namespaceHandlers) {
                    const eventCallbacks = namespaceHandlers.get(event);
                    if (eventCallbacks) {
                        for (const callback of eventCallbacks) {
                            callback(data);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to parse WebSocket message:", err);
            }
        });

        ws.on("close", () => {
            clients.delete(ws);
        });
    });

    return new Promise((resolve) => {
        server.listen(port, () => {
            console.log(`✅ Server running at http://localhost:${port}`);
            resolve();
        });
    });
}

export async function stopService() {
    return new Promise((resolve) => {
        if (server) {
            server.close(() => {
                wss = null;
                server = null;
                clients.clear();
                // Cleanup plugins
                for (const [_, plugin] of plugins) {
                    if (typeof plugin.cleanup === 'function') {
                        plugin.cleanup();
                    }
                }
                plugins.clear();
                eventHandlers.clear();
                resolve();
            });
        } else {
            resolve();
        }
    });
}

export function getPlugins() {
    return Array.from(plugins.values());
}
