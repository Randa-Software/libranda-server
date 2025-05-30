import http from "http";
import fs from "fs/promises";
import path from "path";
import mime from "mime-types";

import * as state from "../state.js";
import { checkPathExists } from "../utils.js";

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
            // check if the http public dir has been set.
            if (!state.getHttpPublicDir()) {
                console.error("The public dir has not been set.");
                await this.sendErrorPage(res, 500);

                return;
            }
            try {
                // Handle URL parameter
                const url_parts = req.url.split("?");
                let url_path = url_parts[0];

                // Check for registered hooks
                const hooks = state.getHttpHooks();
                const method = req.method.toLowerCase();
                const methodHooks = hooks.get(method);

                if (methodHooks && methodHooks.has(url_path)) {
                    try {
                        await methodHooks.get(url_path)(req, res);
                        return;
                    } catch (error) {
                        console.error("Error in HTTP hook:", error);
                        await this.sendErrorPage(res, 500);
                        return;
                    }
                }

                if (url_parts.length > 1) {
                    console.warn(
                        `⚠️  Warning: URL parameters are not implemented (received: ${req.url})`,
                    );
                }
                let file_path = path.join(state.getHttpPublicDir(), url_path);

                // check if path exists
                if (!(await checkPathExists(file_path))) {
                    await this.sendErrorPage(res, 404);
                    return;
                }

                // check if path is directory
                if ((await fs.stat(file_path)).isDirectory()) {
                    if (!url_path.endsWith("/")) {
                        // Redirect to URL with trailing slash
                        res.writeHead(301, {
                            Location: req.url + "/",
                        });
                        res.end();
                        return;
                    }
                    file_path = path.join(file_path, "index.html");
                    if (!(await checkPathExists(file_path))) {
                        await this.sendErrorPage(res, 403);
                        return;
                    }
                }

                const content = await fs.readFile(file_path);
                const content_type = mime.lookup(file_path);

                res.writeHead(200, { "Content-Type": content_type });
                res.end(content);
            } catch (e) {
                console.error(e);
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
            this.server.listen(
                state.getServerPort(),
                state.getServerHost(),
                () => {
                    console.log(
                        `✅ HTTP Server running at http://${state.getServerHost()}:${state.getServerPort()}`,
                    );
                    resolve();
                },
            );
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
