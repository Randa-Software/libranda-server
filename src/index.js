import { HttpServer } from "./server/HttpServer.js";
import { WebSocketServer } from "./server/WebSocketServer.js";
import { PluginManager } from "./plugins/PluginManager.js";
import { EventManager } from "./events/EventManager.js";
import { CommandLine } from "./cli/CommandLine.js";
import * as state from "./state.js";

export async function setServicePort(port) {
    if (state.getHttpServer()) {
        console.warn("Can't change port when the server is already running.");
        return false;
    }
    state.setServerPort(port);
}

export function getServicePort() {
    return state.getServerPort();
}

export async function setServiceHost(host) {
    if (state.getHttpServer()) {
        console.warn("Can't change host when the server is already running.");
        return false;
    }
    state.setServerHost(host);
}

export function getServiceHost() {
    return state.getServerHost();
}

export function setHttpPublicDir(dir) {
    state.setHttpPublicDir(dir);
}

export function getConnectedClients() {
    return state.getWsServer()?.getConnectedClients() ?? 0;
}

export function getConnectedClientIds() {
    return state.getWsServer()?.getClientIds() ?? [];
}

export function emitEvent(clientIdOrClient, namespace, event, data) {
    if (state.getWsServer()) {
        // Handle passing a client object with id property
        const clientId = clientIdOrClient?.id ?? clientIdOrClient;
        state.getWsServer().emitEvent(clientId, namespace, event, data);
    }
}

export function getClientMetadata(clientId) {
    return state.getWsServer()?.getClientMetadata(clientId) ?? null;
}

export function setClientMetadata(clientId, metadata) {
    if (state.getWsServer()) {
        state.getWsServer().setClientMetadata(clientId, metadata);
    }
}

export function registerHttpHook(method, path, handler) {
    const hooks = state.getHttpHooks();
    method = method.toLowerCase();

    if (!hooks.has(method)) {
        hooks.set(method, new Map());
    }

    const methodHooks = hooks.get(method);
    methodHooks.set(path, handler);

    // Return unregister function
    return () => {
        const methodHooks = hooks.get(method);
        if (methodHooks) {
            methodHooks.delete(path);
        }
    };
}

export function registerEvent(namespace, event, callback) {
    return state.getEventManager()
        ? state.getEventManager().registerEvent(namespace, event, callback)
        : () => {};
}

export function registerPlugin(plugin) {
    if (!state.getPluginManager()) {
        throw new Error("Service must be started before registering plugins");
    }

    const plugin_api = {
        registerEvent: (namespace, event, callback) =>
            state.getEventManager().registerEvent(namespace, event, callback),
        broadcast: (message) => state.getWsServer().broadcast(message),
        emitEvent: (clientIdOrClient, namespace, event, data) => {
            const clientId = clientIdOrClient?.id ?? clientIdOrClient;
            state.getWsServer().emitEvent(clientId, namespace, event, data);
        },
        getClientMetadata: (clientId) =>
            state.getWsServer().getClientMetadata(clientId),
        setClientMetadata: (clientId, metadata) =>
            state.getWsServer().setClientMetadata(clientId, metadata),
        getConnectedClientIds: () => state.getWsServer().getClientIds(),
        getConnectedClients: () => state.getWsServer().getConnectedClients(),
        getPluginType: () => {
            return "server";
        },
    };

    return state.getPluginManager().registerPlugin(plugin, plugin_api);
}

export function getPlugins() {
    return state.getPluginManager()
        ? state.getPluginManager().getPlugins()
        : [];
}

export async function startService() {
    if (state.getHttpServer()) return;

    // Initialize all components
    state.setHttpServer(new HttpServer());
    state.setWsServer(new WebSocketServer());

    // Start CLI interface
    const cli = new CommandLine();
    state.setCli(cli);
    cli.start();

    // Start the HTTP server
    await state.getHttpServer().start();

    // Initialize WebSocket server with the HTTP server
    state.getWsServer().initialize(state.getHttpServer().server);
}

export async function stopService() {
    if (!state.getHttpServer()) return;

    // Cleanup all components in reverse order
    state.getWsServer().close();
    await state.getHttpServer().stop();
    state.getPluginManager().cleanup();
    state.getEventManager().clear();
    state.getCli()?.stop();

    // Reset all instances
    state.setWsServer(null);
    state.setHttpServer(null);
    state.setPluginManager(new PluginManager());
    state.setEventManager(new EventManager());
    state.setCli(null);
}
