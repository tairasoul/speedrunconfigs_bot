import { ApplicationCommandOptionTypes } from "oceanic.js";
import declare from "../declare_command.js";
import { git_repo } from "../handler.js";

export default declare(
    {
        name: "update-file",
        description: "Update a file on the repo. Creates it if it doesn't exist.",
        options: [
            {
                name: "file",
                type: ApplicationCommandOptionTypes.ATTACHMENT,
                description: "The file to update.",
                required: true
            },
            {
                name: "build",
                type: ApplicationCommandOptionTypes.STRING,
                description: "The build this is for.",
                required: true
            },
            {
                name: "sub-directory",
                type: ApplicationCommandOptionTypes.STRING,
                description: "The sub directory the file's in. Leave if directly in the build directory.",
                required: false
            }
        ],
        callback: async (interaction, handler) => {
            await interaction.defer();
            const file = interaction.data.options.getAttachment("file", true);
            const subdir = interaction.data.options.getString("sub-directory");
            const build = interaction.data.options.getString("build", true);
            await handler.handleFile(interaction.member?.username as string, build, file.filename, Buffer.from(await (await fetch(file.url)).text()), subdir)
            await interaction.editOriginal(
                {
                    content: `Updated file ${file.filename} at [VAProxy.SpeedrunConfigs](${git_repo}).`
                }
            )
        }
    }
)