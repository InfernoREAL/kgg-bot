module.exports = class PluginBase {
    constructor(name, version) {
        this.Name = name;
        this.Version = version;
    }

    init() {}

    get SdkInfo() {
        return {
            Version: "1.0",
            Name: "KGG.Plugin.SDK"
        };
    }
};