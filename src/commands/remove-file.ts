import { ApplicationCommandOptionTypes } from "oceanic.js";
import declare from "../declare_command.js";
import { git_repo } from "../handler.js";

export default declare(
    {
        name: "remove-file",
        description: "Remove a file on the repo.",
        options: [
            {
                name: "file",
                type: ApplicationCommandOptionTypes.STRING,
                description: "The file to remove.",
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
            const file = interaction.data.options.getString("file", true);
            const subdir = interaction.data.options.getString("sub-directory");
            const build = interaction.data.options.getString("build", true);
            await handler.removeFile(interaction.member?.username as string, build, file, subdir)
            await interaction.editOriginal(
                {
                    content: `Removed file ${file} at [VAProxy.SpeedrunConfigs](${git_repo}).`
                }
            )
        }
    }
)