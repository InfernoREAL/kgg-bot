import gitClient from "simple-git";
import BaseHandler from "./BaseHandler";
import path from "path";
import fs from "fs";

export default class Git extends BaseHandler {
    constructor(plugin) {
        super(plugin, process.env.KGGPLUGINSPATH);

        this._checkFolder = this.checkFolder;

        this.checkFolder = () => {
            this._checkFolder();
            const gitPath = path.join(this.InstallPath, '.git');

            if (!fs.existsSync(gitPath)) {
                this.firstRun = true;
            }
        };

        this.InitializePlugin = () => {
            if (this.validatePlugin()) {
                this.emit("loaded", require(this.pluginMain));
            }
        };

        this.InternalLoader = (gitClient) => {
            this.log("Plugin is being loaded");

            gitClient.fetch(err => {
                if (err !== null) {
                    this.emit('failure', err);
                    return undefined;
                }

                gitClient.status((err, result) => {
                    if (err !== null) {
                        this.emit('failure', err);
                        return undefined;
                    }

                    if (result.behind > 0) {
                        this.log("Plugin is being updated");

                        gitClient.pull(err => {
                            if (err !== null) {
                                this.emit('failure', err);
                                return undefined;
                            }

                            this.log("Plugin updated");
                            this.InitializePlugin();
                        });
                    } else {
                        this.log("Plugin is being initialized");
                        this.InitializePlugin();
                    }
                })
            });
        };
        this.checkFolder();
    }

    loadPlugin() {
        const pluginClient = gitClient(this.InstallPath);
        this.log("Git Client initialized");

        if (this.firstRun) {
            this.log("Plugin is being installed");
            pluginClient.clone(this.Plugin.arguments.url, '.', err => {
                if (err !== null) {
                    this.emit('failure', err);
                    return undefined;
                }
                else {
                    this.InternalLoader(pluginClient);
                }
            });
        } else {
            this.InternalLoader(pluginClient);
        }
    }
};