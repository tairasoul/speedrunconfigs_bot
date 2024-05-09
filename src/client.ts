import * as oceanic from "oceanic.js";
import fs from "node:fs"
import path from 'path';
import { fileURLToPath } from 'url';
import { Client, Collection, ClientOptions } from "oceanic.js";
import * as builders from "@oceanicjs/builders";
import GitHandler from "./handler.js";
const __dirname = path.dirname(decodeURIComponent(fileURLToPath(import.meta.url)));

export type Command = {
    data: builders.ApplicationCommandBuilder, 
    execute: ((interaction: oceanic.CommandInteraction, handler: GitHandler) => Promise<any>)
}

export default class CommandClient extends Client {
    public commands: Collection<string, Command>;
    private rawCommands: Command[];
    constructor(options: ClientOptions) {
        super(options);
        this.commands = new Collection();
        this.rawCommands = [];

        this.setMaxListeners(0);
        this.on("guildCreate", () => {
            this.editStatus("online", [{name: (this.guilds.size).toString() + ' servers', type: 3}]);
        })
        this.on("guildDelete", () => {
            this.editStatus("online", [{name: (this.guilds.size).toString() + ' servers', type: 3}]);
        })
    }


    async loadCommands() {
        for (const command of fs.readdirSync(`${__dirname}/commands`)) {
            const cmd: {
                name: string;
                description: string;
                options: oceanic.ApplicationCommandOptions[];
                callback: (interaction: oceanic.CommandInteraction, handler: GitHandler) => any;
            } = await import(`file://${__dirname}/commands/${command}`).then(m => m.default);
            this.addCommand(cmd.name, cmd.description, cmd.options, cmd.callback);
        }
    }

    addCommand(name: string, description: string, options: oceanic.ApplicationCommandOptions[] = [], callback: (interaction: oceanic.CommandInteraction, handler: GitHandler) => any) {
        const command = new builders.ApplicationCommandBuilder(1, name);
        for (const option of options) {
            command.addOption(option);
        }
        command.setDescription(description);
        command.setDMPermission(false);
        const toPush: Command = {
            data: command,
            execute: callback
        }
        this.rawCommands.push(toPush);
    }

    async registerCommands() {
        for (const command of this.rawCommands) {
            console.log(`creating global command ${command.data.name}`);
            this.commands.set(command.data.name, command);
            try {
                // @ts-ignore
                await this.application.createGlobalCommand(command.data);
            }
            catch {
                console.log(`uh oh! encountered an error trying to create global command ${command.data.name}!\nretrying in 5 seconds.`);
                await new Promise<void>((resolve) => setTimeout(resolve, 5000));
                // @ts-ignore
                await this.application.createGlobalCommand(command.data);
            }
            finally {
                console.log(`created global command ${command.data.name}`)
            }
        }
        this.editStatus("online", [{name: (this.guilds.size).toString() + ' servers', type: 3}]);
    }

    async removeUnknownCommands() {
        for (const globalCommand of await this.application.getGlobalCommands()) {
            if (!this.rawCommands.find((cmd) => cmd.data.name == globalCommand.name)) {
                console.log(`command ${globalCommand.name} was not found in CommandClient.rawCommands, deleting.`)
                await globalCommand.delete();
                console.log(`deleted command ${globalCommand.name}`);
            }
        }
    }
}