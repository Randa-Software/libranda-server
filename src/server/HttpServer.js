import http from "http";
import fs from "fs/promises";
import path from "path";
import { MIME_TYPES } from "../types.js";
import * as state from "../state.js";

export class HttpServer {
    constructor() {
        this.server = null;
    }

    /**
     * Create and configure the HTTP server
     * @returns {http.Server} HTTP server instance
     */
    createServer() {
        this.server = http.createServer(async (req, res) => {
            if (!state.getHttpPublicDir()) {
                res.writeHead(404);
                res.end("The public dir has not been set.");
                return;
            }

            const reqPath = req.url === "/" ? "/index.html" : req.url;
            const fullPath = path.join(state.getHttpPublicDir(), reqPath);

            try {
                const content = await fs.readFile(fullPath);
                const ext = path.extname(fullPath).toLowerCase();
                const contentType = MIME_TYPES[ext] || "text/plain";

                res.writeHead(200, { "Content-Type": contentType });
                res.end(content);
            } catch (err) {
                res.writeHead(404);
                res.end("Not Found");
            }
        });

        return this.server;
    }

    /**
     * Start the HTTP server
     * @returns {Promise<void>}
     */
    start() {
        if (!this.server) {
            this.createServer();
        }

        return new Promise((resolve) => {
            this.server.listen(state.getServerPort(), () => {
                console.log(
                    `✅ HTTP Server running at http://localhost:${state.getServerPort()}`,
                );
                resolve();
            });
        });
    }

    /**
     * Stop the HTTP server
     * @returns {Promise<void>}
     */
    stop() {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    this.server = null;
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}
