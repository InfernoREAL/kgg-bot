const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');

module.exports = class Handler extends EventEmitter {
    log = (...msg) => {
        (console.log).apply(console.log, ["[Plugin Handler]", ...msg]);
    };

    constructor(plugin) {
        super();
        this.Plugin = plugin;
        this.firstRun = false;
        this.pluginMain = path.join(this.Plugin.downloadPath, "index.js");

        this.mainRelativePath = path.relative(__dirname, this.pluginMain);
        this.mainRelativePath = this.mainRelativePath.substr(0, this.mainRelativePath.length - 3);

        this.checkFolder();
    }

    checkFolder() {
        if (!fs.existsSync(this.Plugin.downloadPath)) {
            this.log("Folder created");
            fs.mkdirSync(this.Plugin.downloadPath);
            this.firstRun = true;
        }
    }

    validatePluginSdk(pluginA, pluginB) {
        if (pluginA.SdkInfo === undefined || pluginB.SdkInfo === undefined) {
            return false;
        }

        if (pluginA.SdkInfo.Name === undefined || pluginB.SdkInfo.Name === undefined) {
            return false;
        }

        if (pluginA.SdkInfo.Version === undefined || pluginB.SdkInfo.Version === undefined) {
            return false;
        }

        const sdkA = pluginA.SdkInfo;
        const sdkB = pluginB.SdkInfo;

        return sdkA.Name === sdkB.Name &&
            sdkA.Version === sdkB.Version;
    }

    validatePlugin() {
        if (fs.existsSync(this.pluginMain)) {

            const externalPlugin = new (require(this.mainRelativePath))();
            const basePlugin = new (require('../Plugin').default)();

            return this.validatePluginSdk(externalPlugin, basePlugin); // soon ill add new methods
        } else {
            this.emit("failure", { message: "Invalid Plugin, missing index.js file" });
            return false;
        }
    }

    loadPlugin() {}
};