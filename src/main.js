const fs = require('fs');
const dotEnv = require('dotenv');
const Discord = require('discord.js');
const CPluginManager = require('./PluginManager');

const log = (...msg) => {
    (console.log).apply(console.log, ["[AVC Bot]", ...msg]);
};

if (!fs.existsSync(".env")) {
    log("File \".env\" missing, creating and default one");

    fs.writeFileSync(".env", `DISCORD_TOKEN="XXXXXXXXXXXXXXXXXXXXXX"
PLUGINS_REPOSITORY="https://github.com/darknessxk/kgg-bot-plugins/"
PLUGINS_ENABLED=1
PLUGINS="VoiceManager"`.trim());
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

    if (env.hasOwnProperty('PLUGINS_ENABLED') && env.hasOwnProperty('PLUGINS_REPOSITORY')) {
        if (env.PLUGINS_ENABLED) {
            const PluginManager = new CPluginManager(env.PLUGINS_REPOSITORY);

            PluginManager.on('error', e => {
                log(e);
                process.exit(-1);
            });

            PluginManager.on('initialized', () => {
                if (env.hasOwnProperty('PLUGINS')) {
                    PluginManager.on("ready", () => {
                        // Client.on('ready', () => {
                        //     log(`Logged in as "${Client.user.tag}"`);
                        // });
                        //
                        // Client.login(env.DISCORD_TOKEN).then(() => {}).catch(log);

                    });

                    PluginManager.load(env.PLUGINS, {
                        DiscordClient: Client
                    });
                }
            });

            PluginManager.init();
        }
    }
}