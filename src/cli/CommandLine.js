import * as readline from 'readline';
import * as state from '../state.js';
import * as main from '../index.js';

export class CommandLine {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: '> '
        });

        this.commands = {
            'help': {
                description: 'Show available commands',
                handler: () => this.showHelp()
            },
            'plugins': {
                description: 'List all registered plugins',
                handler: () => this.listPlugins()
            },
            'clients': {
                description: 'List connected clients',
                handler: () => this.listClients()
            },
            'quit': {
                description: 'Stop the server and exit',
                handler: async () => await this.quit()
            }
        };
    }

    start() {
        this.rl.on('line', (line) => {
            const trimmedLine = line.trim();
            if (trimmedLine) {
                this.handleCommand(trimmedLine);
            }
            this.rl.prompt();
        });


        console.log(' Type "help" for available commands.');
        this.rl.prompt();
    }

    async handleCommand(input) {
        const [command, ...args] = input.split(' ');

        if (this.commands[command]) {
            await this.commands[command].handler(args);
        } else {
            console.log(`Unknown command: ${command}`);
            console.log('Type "help" for available commands');
        }
    }

    showHelp() {
        console.log('\nAvailable commands:');
        Object.entries(this.commands).forEach(([command, info]) => {
            console.log(`  ${command.padEnd(10)} - ${info.description}`);
        });
        console.log();
    }

    listPlugins() {
        const plugins = state.getPluginManager()?.getPlugins() ?? [];
        if (plugins.length === 0) {
            console.log('No plugins registered');
            return;
        }

        console.log('\nRegistered plugins:');
        plugins.forEach(plugin => {
            console.log(`  - ${plugin.id}`);
        });
        console.log();
    }

    listClients() {
        const clients = state.getWsServer()?.getClientIds() ?? [];
        const count = state.getWsServer()?.getConnectedClients() ?? 0;

        console.log(`\nConnected clients (${count}):`);
        clients.forEach(clientId => {
            const metadata = state.getWsServer()?.getClientMetadata(clientId);
            console.log(`  - ${clientId}${metadata ? ` (${JSON.stringify(metadata)})` : ''}`);
        });
        console.log();
    }

    async quit() {
        console.log('Stopping server...');
        await main.stopService();
        this.rl.close();
    }

    stop() {
        if (this.rl) {
            this.rl.close();
        }
    }
}
