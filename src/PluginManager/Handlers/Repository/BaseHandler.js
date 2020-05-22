import {EventEmitter} from "events";
import path from "path";
import fs from "fs";

export default class BaseHandler extends EventEmitter {

    log = (...msg) => {
        (console.log).apply(console.log, ["[Repository Handler]", ...msg]);
    };

    constructor(repositoryInfo, basePath) {
        super();
        this.info = repositoryInfo;
        this.InstallPath = path.join(basePath, this.info.name);
        this.configFile = path.join(this.InstallPath, "plugins.json");

        this.firstRun = false;
    }

    get PluginsList() {
        if (!fs.existsSync(this.configFile)) {
            throw `Can't find plugins.json`;
        }

        return JSON.parse(fs.readFileSync(this.configFile).toString());
    }

    findPlugin(pluginName) {
        return this.PluginsList.find(plugin => plugin.name === pluginName);
    }

    Initialize() {}
    Update() {}
    Install() {}
}