import * as oceanic from "oceanic.js";
import GitHandler from "./handler.js";

export default function declare(command: {
    name: string;
    description: string;
    options: oceanic.ApplicationCommandOptions[];
    callback: (interaction: oceanic.CommandInteraction, handler: GitHandler) => any;
}) {
    return command;
}