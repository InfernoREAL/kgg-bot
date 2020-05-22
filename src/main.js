require("@babel/register")({});
import fs from "fs";
import dotEnv from "dotenv";
import Discord from "discord.js";
import os from "os";
import path from "path";
import CPluginManager from "./PluginManager/PluginManager";

process.env.KGGHOME = path.join(os.homedir(), "kgg-bot");
process.env.KGGREPOSITORIESPATH = path.join(process.env.KGGHOME, "repositories");
process.env.KGGPLUGINSPATH = path.join(process.env.KGGHOME, "plugins");

const CurrentBotVersion = 0;
const IncompatibilityTable = [];

const log = (...msg) => {
    (console.log).apply(console.log, ["[KGG Bot]", ...msg]);
};

const versionFile = path.join(process.env.KGGHOME, "version.json");

const writeCurrentVersion = () => {
    fs.writeFileSync(versionFile, JSON.stringify({
        version: CurrentBotVersion
    }));
};


if (!fs.existsSync(process.env.KGGHOME)) {
    fs.mkdirSync(process.env.KGGHOME);
    writeCurrentVersion();
} else {
    if (!fs.existsSync(versionFile)) {
        writeCurrentVersion();
    } else {
        const fileBuffer = fs.readFileSync(versionFile);
        const fileAsString = fileBuffer.toString();
        const versionJson = JSON.parse(fileAsString);

        if (versionJson.version === undefined) {
            log("Invalid Version File");
            process.exit(-1);
        }

        if (versionJson.version > CurrentBotVersion) {
            log(`Incompatible version ${CurrentBotVersion} can't execute properly with configs from version ${versionJson.version}.`);
            process.exit(-1);
        }

        if (IncompatibilityTable.find(version => version === versionJson.version) !== undefined) {
            log(`Incompatible version ${CurrentBotVersion} can't execute properly with configs from version ${versionJson.version}.`);
            process.exit(-1);
        }
    }
}

if (!fs.existsSync(process.env.KGGREPOSITORIESPATH)) {
    fs.mkdirSync(process.env.KGGREPOSITORIESPATH);
}

if (!fs.existsSync(".env")) {
    log("File \".env\" missing, creating and default one");
    fs.writeFileSync(".env", `DISCORD_TOKEN="XXXXXXXXXXXXXXXXXXXXXX"\r\nPLUGINS_ENABLED=1`.trim());
}

const envParsed = dotEnv.config({
    path: ".env"
});

const env = envParsed.parsed;

if (env.hasOwnProperty('DISCORD_TOKEN')) {
    if (env.DISCORD_TOKEN === 'XXXXXXXXXXXXXXXXXXXXXX') {
        log('Invalid Token, please edit your env file');
        process.exit(0);
    }

    const Client = new Discord.Client();

    if (!fs.existsSync("plugins.json")) {
        fs.copyFileSync("plugins.example.json", "plugins.json");
    }

    const PluginManager = new CPluginManager();

    PluginManager.on('error', e => {
        log(e);
        process.exit(-1);
    });

    PluginManager.on('initialized', () => {
        PluginManager.on("ready", (modules) => {
            Client.on('ready', () => {
                log(`Logged in as "${Client.user.tag}"`);
            });

            Client.login(env.DISCORD_TOKEN).then(() => {}).catch(log);
        });

        PluginManager.load({
            DiscordClient: Client
        });
    });
}