import {EventEmitter} from "events";

import fs from "fs";
import path from "path";

export default class BaseHandler extends EventEmitter {
    log = (...msg) => {
        (console.log).apply(console.log, ["[Plugin Handler]", ...msg]);
    };

    constructor(plugin, basePath) {
        super();
        this.Plugin = plugin;
        this.firstRun = false;
        this.InstallPath = path.join(basePath, this.Plugin.name);
        this.pluginMain = path.join(this.InstallPath, "index.js");


        this.checkFolder();
    }

    checkFolder() {
        if (!fs.existsSync(this.InstallPath)) {
            this.log("Folder created");
            fs.mkdirSync(this.InstallPath);
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
            const externalPlugin = new (require(this.pluginMain))();
            const basePlugin = new (require('../../SDK/PluginBase'))();

            return this.validatePluginSdk(externalPlugin, basePlugin); // soon ill add new methods
        } else {
            this.emit("failure", { message: "Invalid Plugin, missing index.js file" });
            return false;
        }
    }

    loadPlugin() {}
};