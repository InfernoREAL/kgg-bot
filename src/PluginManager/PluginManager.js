const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const Queue = require('better-queue');
const gitClient = require('simple-git');

const log = (...msg) => {
    (console.log).apply(console.log, ["[Plugin Manager]", ...msg]);
};

function loadHandlers() {
    let classes = {};
    const classesPath = path.join(__dirname, "Handlers");

    fs.readdirSync(classesPath).forEach(file => {
        if (file.substr(-3, 3) === '.js') {
            const reqPath = path.join(classesPath, file);
            const filename = file.substring(0, file.lastIndexOf('.'));

            if (!classes.hasOwnProperty(filename)) {
                classes[filename] = require(reqPath);
            }
        }
    });

    return classes;
}

module.exports = class PluginManager extends EventEmitter {
    constructor(repository, credentials = 'ssh-key', handler = 'Git') {
        super();

        this.repository = repository;
        this.credentials = credentials;
        this.pluginsFolder = path.join(__dirname, "plugins");
        this.getPluginPath = (pluginName) => path.join(this.pluginsFolder, pluginName);
        this.repoFolder = this.getPluginPath('repository-core');
        this.pendingCount = 0;
        this.loadedModules = {};
        this.handlers = loadHandlers();

        if (this.handlers.hasOwnProperty(handler)) {
            this.defaultHandler = this.handlers[handler];
        } else {
            const handlerKeys = Object.keys(this.handlers);
            this.defaultHandler = this.handlers[handlerKeys[0]];
        }

        if (!fs.existsSync(this.pluginsFolder)) {
            fs.mkdirSync(this.pluginsFolder);
        }

        this.loadPluginBase = (plugin, cb) => {
            const handler = new this.defaultHandler(plugin);
            handler.on('loaded', o => cb({success: true, object: o}));
            handler.on('failure', err => cb({success: false, ...err}));
            handler.loadPlugin();
        };

        this.queue = new Queue((plugin, callback) => {
            this.loadPluginBase(plugin, callback);
        });

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
                plugins.forEach(plugin => {
                    const pluginSearch = availablePlugins.find(aPlugin => aPlugin.name === plugin);
                    if (pluginSearch !== undefined) {
                        this.pendingCount++;
                        this.queue.push({
                            "downloadPath": this.getPluginPath(plugin),
                            "basePath": this.pluginsFolder,
                            "pluginInfo": pluginSearch,
                            "credentials": credentials,
                            "args": args
                        }, result => {
                            this.pendingCount--;

                            if (result.success) {
                                log("Load Success", result);
                                // initialize this mf
                                this.loadedModules[plugin] = new result.object();
                                this.loadedModules[plugin].init(args);
                            } else {
                                log("Load Failure", result);
                            }

                            if (this.pendingCount <= 0) {
                                this.emit('ready', this.loadedModules);
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
            const repositoryGit = gitClient(this.pluginsFolder);
            repositoryGit.clone(this.repository, this.repoFolder, [], () => {
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