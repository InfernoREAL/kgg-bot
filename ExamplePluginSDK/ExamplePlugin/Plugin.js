export default class Plugin {
    constructor(name, version) {
        this.Name = name;
        this.Version = version;
    }

    init(discordClient) {}
    SdkInfo = {
        Version: "1.0",
        Name: "KGG.Plugin.SDK"
    };
};