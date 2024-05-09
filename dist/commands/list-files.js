import declare from "../declare_command.js";
function formatDirectoryStructure(paths) {
    const structure = {};
    // Iterate through each path and build the directory structure
    for (const path of paths) {
        const parts = path.split('/');
        let currentDir = structure;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!currentDir[part]) {
                currentDir[part] = {};
            }
            currentDir = currentDir[part];
        }
        const fileName = parts.pop();
        if (!currentDir[fileName]) {
            currentDir[fileName] = [fileName];
        }
        else {
            currentDir[fileName].push(fileName);
        }
    }
    // Format the directory structure into the desired format
    return formatIndentedStructure(structure);
}
function formatIndentedStructure(structure, depth = 0) {
    let result = '';
    for (const key in structure) {
        const value = structure[key];
        const indentation = '     '.repeat(depth);
        if (Array.isArray(value)) {
            for (const file of value) {
                result += `${indentation}:scroll: ${file}\n`;
            }
        }
        else {
            result += `${indentation}:file_folder: ${key}\n${formatIndentedStructure(value, depth + 1)}`;
        }
    }
    return result;
}
export default declare({
    name: "list-files",
    description: "List all files linked to your username.",
    options: [],
    callback: async (interaction, handler) => {
        const files = handler.listFiles(interaction.member?.username);
        const dir = formatDirectoryStructure(files);
        await interaction.reply({
            content: dir
        });
    }
});
