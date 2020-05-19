const gitClient = require('simple-git');
const Handler = require('./Handler');
const path = require('path');
const fs = require('fs');

module.exports = class Git extends Handler {
    constructor(plugin) {
        super(plugin);

        this._checkFolder = this.checkFolder;

        this.checkFolder = () => {
            this._checkFolder();
            const gitPath = path.join(this.Plugin.downloadPath, '.git');

            if (!fs.existsSync(gitPath)) {
                this.firstRun = true;
            }
        };

        this.InitializePlugin = () => {
            if (this.validatePlugin()) {
                this.emit("loaded", require(this.mainRelativePath));
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
        const pluginClient = gitClient(this.Plugin.downloadPath);
        this.log("Git Client initialized");

        if (this.firstRun) {
            this.log("Plugin is being installed");
            pluginClient.clone(this.Plugin.pluginInfo.downloadUrl, '.', err => {
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