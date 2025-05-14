import { PluginManager } from "./plugins/PluginManager.js";
import { EventManager } from "./events/EventManager.js";

let _server_port = 3000;
let _http_public_dir = null;
let _http_server = null;
let _ws_server = null;
let _plugin_manager = new PluginManager();
let _event_manager = new EventManager();

export function getServerPort() {
    return _server_port;
}

export function setServerPort(port) {
    _server_port = port;
}

export function getHttpPublicDir() {
    return _http_public_dir;
}

export function setHttpPublicDir(dir) {
    _http_public_dir = dir;
}

export function getHttpServer() {
    return _http_server;
}

export function setHttpServer(server) {
    _http_server = server;
}

export function getWsServer() {
    return _ws_server;
}

export function setWsServer(server) {
    _ws_server = server;
}

export function getPluginManager() {
    return _plugin_manager;
}

export function setPluginManager(manager) {
    _plugin_manager = manager;
}

export function getEventManager() {
    return _event_manager;
}

export function setEventManager(manager) {
    _event_manager = manager;
}
