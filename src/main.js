const fs = require('fs');
const dotenv = require('dotenv');
const Discord = require('discord.js');
const DiscordCommands = new (require('./Discord/Discord.Commands.Dictionary'))("--");

const log = (...msg) => {
    (console.log).apply(console.log, ["[AVC Bot]", ...msg]);
};

if (!fs.existsSync(".env")) {
    log("File \".env\" missing, creating and default one");

    fs.writeFileSync(".env", `
    DISCORD_TOKEN=XXXXXXXXXXXXXXXXXXXXXX
    `.trim());
}

const envParsed = dotenv.config({
    path: ".env"
});

const env = envParsed.parsed;

if (env.hasOwnProperty('DISCORD_TOKEN')) {
    if (env.DISCORD_TOKEN === 'XXXXXXXXXXXXXXXXXXXXXX') {
        log('Invalid Token, please edit your env file');
        process.exit(0);
    }

    const Client = new Discord.Client();

    Client.on('ready', () => {
        log(`Logged in as "${Client.user.tag}"`);
        log(`Initialized ${DiscordCommands.getCommandsCount()} command(s)`);
        log(`Commands List: ${DiscordCommands.fetchCommands().join(', ')}`);
    });

    Client.on('message', msg => DiscordCommands.messageSent(msg));

    Client.login(env.DISCORD_TOKEN);
}