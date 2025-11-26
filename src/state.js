import { PluginManager } from "./plugins/PluginManager.js";
import { EventManager } from "./events/EventManager.js";

let _server_port = 3000;
let _server_host = "localhost";
let _http_public_dir = null;
let _http_public_single_page = false;
let _http_server = null;
let _ws_server = null;
let _cli = null;
let _plugin_manager = new PluginManager();
let _event_manager = new EventManager();
let _http_hooks = new Map();

export function getServerPort() {
    return _server_port;
}

export function setServerPort(port) {
    _server_port = port;
}

export function getServerHost() {
    return _server_host;
}

export function setServerHost(host) {
    _server_host = host;
}

export function getHttpPublicDir() {
    return _http_public_dir;
}

export function setHttpPublicDir(dir) {
    _http_public_dir = dir;
}

export function getHttpPublicSinglePage() {
    return _http_public_single_page;
}

export function setHttpPublicSinglePage(bool) {
    _http_public_single_page = bool;
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

export function getCli() {
    return _cli;
}

export function setCli(new_cli) {
    _cli = new_cli;
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

export function getHttpHooks() {
    return _http_hooks;
}
