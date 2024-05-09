import fs from "node:fs"
import path from 'path';
import { fileURLToPath } from 'url';
import isomorphic from "isomorphic-git";
import http from "isomorphic-git/http/node/index.js";
import adm from "adm-zip";
const __dirname = path.dirname(decodeURIComponent(fileURLToPath(import.meta.url)));
const { gh_token, author }: { gh_token: string, author: { name: string, email: string } } = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "config.json"), 'utf8'));

/*const opts: nodegit.CloneOptions = {
    fetchOpts: {
        callbacks: {
            certificateCheck: () => 0,
            credentials: () => nodegit.Cred.userpassPlaintextNew(gh_token, "x-oauth-basic")
        }
    }
}*/

export const git_repo = "https://github.com/tairasoul/VAProxy.SpeedrunConfigs";

const git_repo_path = __dirname + "/VAProxy.SpeedrunConfigs"

async function pack_zips() {
    const directories = fs.readdirSync(git_repo_path);
    const sorted = [];
    const blacklist = ["README.md", "github-actions-nodejs", ".git", ".github", "node_modules", "package.json", "package-lock.json"];
    for (const sort of directories) {
        if (!blacklist.includes(sort)) {
            sorted.push(sort);
        }
    }
    for (const directory of sorted) {
        if (fs.existsSync(`${git_repo_path}/${directory}`)) {
            const builds = fs.readdirSync(`${git_repo_path}/${directory}`).filter((v) => v != "Builds");
            for (const build of builds) {
                const files = fs.readdirSync(`${git_repo_path}/${directory}/${build}`);
                const zip = new adm();
                for (const file of files) {
                    if (fs.statSync(`${git_repo_path}/${directory}/${build}/${file}`).isDirectory()) 
                        zip.addLocalFolder(`${git_repo_path}/${directory}/${build}/${file}`)
                    else
                        zip.addLocalFile(`${git_repo_path}/${directory}/${build}/${file}`);
                }
                if (!fs.existsSync(`${git_repo_path}/${directory}/Builds`)) fs.mkdirSync(`${git_repo_path}/${directory}/Builds`);
                zip.writeZip(`${git_repo_path}/${directory}/Builds/${build}.zip`);
                await isomorphic.add(
                    {
                        fs,
                        dir: git_repo_path,
                        filepath: `${directory}/Builds/${build}.zip`
                    }
                )
            }
        }
    }
}

async function checkRepoExistence() {
    if (!fs.existsSync(git_repo_path)) {
        await isomorphic.clone(
            {
                fs, 
                http, 
                dir: git_repo_path, 
                url: git_repo, 
                onAuth: async (url, gitauth) => {
                    return {
                        username: "speedrunconfigs-bot",
                        password: gh_token
                    }
                }
            }
        )
    }
}

function removeEmptyDirectoriesUpToRoot(directory: string, rootDirectory: string) {
    if (directory === rootDirectory) {
        return; // Stop recursion when reaching the root directory
    }

    const files = fs.readdirSync(directory);
    if (files.length === 0) {
        fs.rmdirSync(directory);
        const parentDirectory = path.dirname(directory);
        removeEmptyDirectoriesUpToRoot(parentDirectory, rootDirectory);
    }
}

async function FileHandle(username: string, build: string, file: string, data: Buffer, additionalPath: string = "") {
    const dir = path.join(git_repo_path, username, build, additionalPath);
    if (!fs.existsSync(dir))
        fs.mkdirSync(dir, {recursive: true});
    const filePath = path.join(dir, file);
    fs.writeFileSync(filePath, data);
    await isomorphic.add(
        {
            fs,
            dir: git_repo_path,
            filepath: path.join(username, build, additionalPath, file)
        }
    )
    await pack_zips();
}

async function RemoveFile(username: string, build: string, file: string, additionalPath: string = "", isBuildRemoval = false) {
    const dir = path.join(git_repo_path, username, build, additionalPath);
    if (!fs.existsSync(dir))
        return;
    const filePath = path.join(dir, file);
    if (!fs.existsSync(filePath))
        return;
    await isomorphic.remove(
        {
            fs,
            dir: git_repo_path,
            filepath: path.join(username, build, additionalPath, file)
        }
    )
    fs.rmSync(filePath);
    removeEmptyDirectoriesUpToRoot(dir, path.join(git_repo_path, username));
    if (isBuildRemoval)
        return;
    const buildFolders = fs.readdirSync(path.join(git_repo_path, username)).filter((v) => v != "Builds");
    const builds = fs.readdirSync(path.join(git_repo_path, username, "Builds"));
    for (const build of builds) {
        if (!buildFolders.includes(build.replace(".zip", ""))) {
            await RemoveFile(username, "Builds", build, "", true);
            /*await isomorphic.remove(
                {
                    fs,
                    dir: git_repo,
                    filepath: path.join(username, "Builds", build)
                }
            )
            fs.rmSync(path.join(git_repo_path, username, "Builds", build));*/
        }
    }
    removeEmptyDirectoriesUpToRoot(path.join(git_repo_path, username), git_repo_path);
}

async function updateRepo() {
    await isomorphic.commit(
        {
            fs,
            message: "Update files from speedrunconfigs-bot",
            author: {
                name: author.name,
                email: author.email
            },
            committer: {
                name: author.name,
                email: author.email
            },
            dir: git_repo_path
        }
    )
    await isomorphic.push(
        {
            fs,
            http,
            dir: git_repo_path, 
            url: git_repo, 
            onAuth: async (url, gitauth) => {
                return {
                    username: "speedrunconfigs-bot",
                    password: gh_token
                }
            }
        }
    )
}

async function pullLatest() {
    await isomorphic.pull(
        {
            fs,
            http,
            dir: git_repo_path,
            author: {
                name: author.name,
                email: author.email
            },
            onAuth: async (url, gitauth) => {
                return {
                    username: "speedrunconfigs-bot",
                    password: gh_token
                }
            },
            
        }
    )
}

export default class GitHandler {
    private constructor() {}

    static async init() {
        await checkRepoExistence();
        await pullLatest();
        return new this();
    }

    async update() {
        await pullLatest();
    }

    async handleFile(username: string, build: string, file: string, data: Buffer, additionalPath: string = "") {
        await this.update();
        await FileHandle(username, build, file, data, additionalPath);
        await updateRepo();
    }

    async removeFile(username: string, build: string, file: string, additionalPath: string = ""){
        await this.update();
        await RemoveFile(username, build, file, additionalPath);
        await updateRepo();
    }

    listFiles(username: string) {
        const files = fs.readdirSync(path.join(git_repo_path, username), { recursive: true, encoding: 'utf8'})
        const result: string[] = [];
        for (const file of files) {
            if (fs.statSync(path.join(git_repo_path, username, file)).isFile()) {
                result.push(file);
            }
        }
        return result.filter((v) => !v.endsWith(".zip"));
    }
}