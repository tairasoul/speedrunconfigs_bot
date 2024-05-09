import declare from "../declare_command.js";

interface Directory {
    [key: string]: Directory | string[];
}

function formatDirectoryStructure(paths: string[]): string {
    const structure: Directory = {};

    // Iterate through each path and build the directory structure
    for (const path of paths) {
        const parts = path.split('/');

        let currentDir = structure;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!currentDir[part]) {
                currentDir[part] = {};
            }
            currentDir = currentDir[part] as Directory;
        }

        const fileName = parts.pop()!;
        if (!currentDir[fileName]) {
            currentDir[fileName] = [fileName];
        } else {
            (currentDir[fileName] as string[]).push(fileName);
        }
    }

    // Format the directory structure into the desired format
    return formatIndentedStructure(structure);
}

function formatIndentedStructure(structure: Directory, depth: number = 0): string {
    let result = '';

    for (const key in structure) {
        const value = structure[key];
        const indentation = '     '.repeat(depth);
        if (Array.isArray(value)) {
            for (const file of value) {
                result += `${indentation}:scroll: ${file}\n`;
            }
        } else {
            result += `${indentation}:file_folder: ${key}\n${formatIndentedStructure(value as Directory, depth + 1)}`;
        }
    }

    return result;
}

export default declare(
    {
        name: "list-files",
        description: "List all files linked to your username.",
        options: [],
        callback: async (interaction, handler) => {
            const files = handler.listFiles(interaction.member?.username as string);
            const dir = formatDirectoryStructure(files);
            await interaction.reply(
                {
                    content: dir
                }
            )
        }
    }
)