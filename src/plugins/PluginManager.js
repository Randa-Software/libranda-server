import { EventManager } from "../events/EventManager.js";

export class PluginManager {
    constructor() {
        this.plugins = new Map(); // pluginId -> plugin instance
        this.eventManager = new EventManager();
    }

    /**
     * Get all registered plugins
     * @returns {Array} Array of plugin instances
     */
    getPlugins() {
        return Array.from(this.plugins.values());
    }

    /**
     * Register a plugin
     * @param {Object} plugin - Plugin instance
     * @param {Object} api - Plugin API interface
     * @returns {function} Cleanup function to unregister the plugin
     */
    registerPlugin(plugin, api) {
        if (!plugin.id) {
            throw new Error("Plugin must have an id property");
        }
        if (this.plugins.has(plugin.id)) {
            throw new Error(
                `Plugin with id ${plugin.id} is already registered`,
            );
        }

        this.plugins.set(plugin.id, plugin);
        if (typeof plugin.initialize === "function") {
            plugin.initialize(api);
        }

        return () => this.unregisterPlugin(plugin.id);
    }

    /**
     * Unregister a plugin by ID
     * @param {string} pluginId - Plugin ID to unregister
     */
    unregisterPlugin(pluginId) {
        const plugin = this.plugins.get(pluginId);
        if (plugin) {
            if (typeof plugin.cleanup === "function") {
                try {
                    plugin.cleanup();
                } catch (err) {
                    console.error(`Error cleaning up plugin ${pluginId}:`, err);
                }
            }
            this.plugins.delete(pluginId);
        }
    }

    /**
     * Clean up all plugins
     */
    cleanup() {
        for (const [pluginId] of this.plugins) {
            this.unregisterPlugin(pluginId);
        }
        this.plugins.clear();
    }
}
