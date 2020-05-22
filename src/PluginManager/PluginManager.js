import fs from "fs";
import path from "path";
import {EventEmitter} from "events";
import gitClient from "simple-git";
import Queue from "better-queue";
import DynamicLoading from "../Helpers/DynamicLoading";
import {PluginRepository} from "./PluginRepository";

const log = (...msg) => {
    (console.log).apply(console.log, ["[Plugin Manager]", ...msg]);
};

function findAndLoadHandler(targetFile) {
    if (targetFile === undefined)
        throw `targetFile can't be undefined`;
    if (targetFile === null)
        throw `targetFile can't be null`;
    if (targetFile.length === 0)
        throw `targetFile must be set`;

    return DynamicLoading(path.join(__dirname, "Handlers", "Plugin"), targetFile, true);
}

export default class PluginManager extends EventEmitter {
    constructor() {
        super();

        this.pluginsConfig = JSON.parse(fs.readFileSync("plugins.json").toString());
        this.repository = new PluginRepository(this.pluginsConfig["repositories"]);
        this.repository.on("ready", () => {
            this.emit("initialized");
        });

        this.pluginsFolder = process.env.KGGPLUGINSPATH;
        this.pendingCount = 0;
        this.loadedModules = {};

        if (!fs.existsSync(this.pluginsFolder)) {
            fs.mkdirSync(this.pluginsFolder);
        }

        this.loadPluginBase = (plugin, cb) => {
            const cHandler = findAndLoadHandler(plugin.handler);

            if (cHandler === undefined)
                throw `Invalid Handler ${plugin.handler}`;

            const handler = new cHandler.default(plugin);
            handler.on('loaded', o => cb(null, {success: true, object: o}));
            handler.on('failure', err => cb(err, {success: false}));
            handler.loadPlugin();
        };

        this.queue = new Queue((plugin, callback) => this.loadPluginBase(plugin, callback));

        const checkPendingAndReduce = () => {
            this.pendingCount--;

            if (this.pendingCount <= 0) {
                this.emit('ready', this.loadedModules);
            }
        };

        this.queue.on('task_finish', (id) => {
            log("Task", id, "success to load plugin");
            checkPendingAndReduce();
        });
        this.queue.on('task_failed', (id, err) => {
            log("Task", id, "failed to load plugin with message:", err);
            checkPendingAndReduce();
        });

        this.on('ready', () => log("Plugin loading is done"));
    }

    load(args) {
        this.pluginsConfig.plugins.forEach(plugin => {
            const pluginObject = this.repository.findPlugin(plugin);

            if (pluginObject !== undefined) {
                this.pendingCount++;
                this.queue.push(pluginObject, (err, result) => {
                    if (result.success) {
                        this.loadedModules[plugin] = new result.object();
                        this.loadedModules[plugin].init(args);
                    }
                });
            } else {
                log("Unable to find plugin on loaded repositories list:", plugin);
            }
        });
    }
};