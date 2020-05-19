const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const Queue = require('better-queue');
const gitClient = require('simple-git');

const log = (...msg) => {
    (console.log).apply(console.log, ["[Plugin Manager]", ...msg]);
};


module.exports = class PluginManager extends EventEmitter {
    constructor(repository, credentials = 'ssh-key') {
        super();

        this.repository = repository;
        this.credentials = credentials;
        this.pluginsFolder = path.join(__dirname, "plugins");
        this.getPluginPath = (pluginName) => path.join(this.pluginsFolder, pluginName);
        this.repoFolder = this.getPluginPath('repository-core');
        this.pendingCount = 0;

        this.queue = new Queue(function (plugin, cb) {
            // if (this.checkInstalled(plugin)) {
            //     if (this.checkVersion(plugin)) {
            //         this.queue.push(this.update(plugin).then(() => this.initialize(plugin, args)), () => {
            //             this.emit("load-complete");
            //         });
            //     }
            // } else {
            //     this.queue.push(this.install(plugin).then(() => this.initialize(plugin, args)), () => {
            //         this.emit("load-complete");
            //     });
            // }
            log("Loading plugin", plugin.name);
            cb();
        });

        if (!fs.existsSync(this.pluginsFolder)) {
            fs.mkdirSync(this.pluginsFolder);
        }

        this.gitClient = gitClient(this.pluginsFolder);

        this.checkInstalled = (pluginName) => {
            return fs.existsSync(this.getPluginPath(pluginName));
        };

        this.checkVersion = (pluginName) => {
            if (this.checkInstalled(pluginName)) {
                const result = this.gitClient.fetch();

                console.log(result);
            }
            return false;
        };

        this.update = (pluginName) => {
            if (this.checkVersion(pluginName)) {

            } else {
                return false;
            }
        };

        this.install = (pluginName) => {
            log(`Installing Plugin "${pluginName}"`);
        };

        this.initialize = (pluginName, args) => {
            log(fs.readdirSync(this.getPluginPath(pluginName)));
        };

        this._load = async (pluginList, args) => {
            const pluginsFile = fs.readdirSync(this.repoFolder).find(x => x === "plugins.json");
            const pluginsFileContent = fs.readFileSync(path.join(this.repoFolder, pluginsFile)).toString();
            let availablePlugins;

            if (pluginsFileContent !== undefined) {
                try {
                    availablePlugins = JSON.parse(pluginsFileContent);
                } catch (e) {
                    log("Error!", e);
                    process.exit(0);
                }
            } else {
                console.log("Can't read plugins file content");
                process.exit(0);
                return;
            }

            if (pluginsFile !== undefined) {
                const plugins = pluginList.split(',');
                this.pendingCount = plugins.length;

                plugins.forEach(plugin => {
                    const pluginSearch = availablePlugins.find(aPlugin => aPlugin.name === plugin);
                    if (pluginSearch !== undefined) {
                        this.queue.push({
                            "name": plugin,
                            "arguments": args
                        }, () => {
                            if (this.pendingCount > 0) {
                                this.pendingCount--;
                            }

                            if (this.pendingCount === 0) {
                                this.emit('ready');
                            }
                        });
                    }
                })
            }
        };

        this.on('initialized', () => log("Plugin repository is initialized"));
        this.on('ready', () => log("Plugin loading is done"));
    }

    init() {
        if (!fs.existsSync(this.repoFolder)) {
            this.gitClient.clone(this.repository, this.repoFolder, [], result => {
                this.emit('initialized');
            });
        } else {
            const repositoryGit = gitClient(this.repoFolder);

            repositoryGit.fetch(() => {
                repositoryGit.status((err, result)=> {
                    if (result.behind > 0) {
                        log('Updating Plugins Repository');
                        repositoryGit.pull((err, result) => {
                            if (err === null) {
                                this.emit('initialized');
                            }
                        });
                    } else {
                        this.emit('initialized');
                    }
                });
            });
        }
    }

    load(pluginList, args) {
        return this._load(pluginList, args);
    }
};