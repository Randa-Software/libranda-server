import http from "http";
import fs from "fs/promises";
import path from "path";
import { MIME_TYPES } from "../types.js";
import * as state from "../state.js";

const ERROR_PAGES = {
    403: {
        title: "403 Forbidden",
        message: "Directory listing is not allowed.",
    },
    404: {
        title: "404 Not Found",
        message: "The requested resource could not be found on this server.",
    },
    500: {
        title: "500 Internal Server Error",
        message: "An internal server error occurred.",
    },
};

export class HttpServer {
    constructor() {
        this.server = null;
    }

    /**
     * Send an error page response
     * @param {http.ServerResponse} res Response object
     * @param {number} statusCode HTTP status code
     * @returns {Promise<void>}
     */
    async sendErrorPage(res, statusCode) {
        try {
            // Try to load custom error page
            const errorFile = path.join(
                state.getHttpPublicDir(),
                `${statusCode}.html`,
            );
            const content = await fs.readFile(errorFile);
            res.writeHead(statusCode, { "Content-Type": "text/html" });
            res.end(content);
        } catch (err) {
            // Fall back to default error page
            const errorInfo = ERROR_PAGES[statusCode] || ERROR_PAGES[500];
            const html = `<!DOCTYPE html>
<html>
<head>
    <title>${errorInfo.title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 50px;
        }
        h1 { color: #444; }
        p { color: #666; }
    </style>
</head>
<body>
    <h1>${errorInfo.title}</h1>
    <p>${errorInfo.message}</p>
</body>
</html>`;
            res.writeHead(statusCode, { "Content-Type": "text/html" });
            res.end(html);
        }
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

            // Handle URL parameters by removing them
            const urlParts = req.url.split("?");
            let reqPath = urlParts[0];
            if (urlParts.length > 1) {
                console.warn(
                    `⚠️  Warning: URL parameters are not implemented (received: ${req.url})`,
                );
            }
            let fullPath = path.join(state.getHttpPublicDir(), reqPath);

            try {
                // First try the exact path
                await fs.access(fullPath);
                const stats = await fs.stat(fullPath);

                if (stats.isDirectory()) {
                    // If it's a directory, look for index.html
                    const indexPath = path.join(fullPath, "index.html");
                    try {
                        await fs.access(indexPath);
                        reqPath = path.join(reqPath, "index.html");
                        fullPath = indexPath;
                    } catch (indexErr) {
                        await this.sendErrorPage(res, 403);
                        return;
                    }
                }
            } catch (err) {
                // If the exact path doesn't exist, try with /index.html
                const possibleDirPath = path.join(
                    state.getHttpPublicDir(),
                    reqPath,
                    "index.html",
                );
                try {
                    await fs.access(possibleDirPath);
                    // If index.html exists, use it
                    reqPath = path.join(reqPath, "index.html");
                    fullPath = possibleDirPath;
                } catch (dirErr) {
                    // Check if the original path is a directory
                    const originalPath = path.join(
                        state.getHttpPublicDir(),
                        reqPath,
                    );
                    try {
                        const stats = await fs.stat(originalPath);
                        if (stats.isDirectory()) {
                            await this.sendErrorPage(res, 403);
                            return;
                        }
                    } catch {
                        // Not a directory, return 404
                        await this.sendErrorPage(res, 404);
                        return;
                    }
                    await this.sendErrorPage(res, 404);
                    return;
                }
            }

            try {
                const content = await fs.readFile(fullPath);
                const ext = path.extname(fullPath).toLowerCase();
                const contentType = MIME_TYPES[ext] || "text/plain";

                res.writeHead(200, { "Content-Type": contentType });
                res.end(content);
            } catch (err) {
                await this.sendErrorPage(res, 500);
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
