import PluginBase from "../../PluginBase";

module.exports = class ExamplePlugin extends PluginBase {
    constructor() {
        super("ExamplePlugin", "1");
    }

    init(args) {
        const discordClient = args.DiscordClient;
        super.init(discordClient);

        discordClient.on('message', msg => {
            const content = msg.content;

            if (content === "ping") {
                msg.reply("pong!");
            }
        });
    }
};