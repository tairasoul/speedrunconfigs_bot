import fs from "node:fs";
import path from 'path';
import { fileURLToPath } from 'url';
import CommandClient from "./client.js";
import GitHandler from "./handler.js";
const __dirname = path.dirname(decodeURIComponent(fileURLToPath(import.meta.url)));
const { bot_token } = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "config.json"), "utf8"));
const client = new CommandClient({
    auth: `Bot ${bot_token}`,
    gateway: {
        intents: [
            "MESSAGE_CONTENT",
            "GUILDS",
            "GUILD_MESSAGES"
        ]
    }
});
client.on("ready", async () => {
    await client.loadCommands();
    await client.registerCommands();
    await client.removeUnknownCommands();
});
const handler = await GitHandler.init();
client.on('interactionCreate', async (interaction) => {
    // @ts-ignore
    const command = client.commands.get(interaction.data.name);
    if (!command)
        return;
    try {
        await command.execute(interaction, handler);
    }
    catch (error) {
        if (error)
            console.error(error);
        if (!interaction.acknowledged) {
            await interaction.createMessage({ content: `There was an error while executing this command, error is ${error}` });
        }
        else {
            await interaction.editOriginal({ content: `There was an error while executing this command, error is ${error}` });
        }
    }
});
await client.connect();
