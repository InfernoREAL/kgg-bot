import {EventEmitter} from "events";
import Queue from "better-queue";
import path from "path";
import DynamicLoading from "../Helpers/DynamicLoading";

function findAndLoadHandler(targetFilename) {
    return DynamicLoading(path.join(__dirname, "Handlers", "Repository"), targetFilename, true);
}

export class PluginRepository extends EventEmitter {
    log = (...msg) => {
        (console.log).apply(console.log, ["[Plugin Repository]", ...msg]);
    };

    constructor(repositoriesInfo) {
        super();
        if (repositoriesInfo === undefined) {
            throw `repositoriesInfo argument can't be undefined`;
        }

        this.pendingCount = 0;
        this.repositories = [];
        this.ready = false;

        const verifyState = () => {
            if (this.pendingCount > 0)
                this.pendingCount--;

            if (this.pendingCount === 0) {
                this.log("Ready");
                this.ready = true;
                this.emit('ready');
            }
        };

        repositoriesInfo.forEach(repository => {
            if (repository.name === undefined)
                throw `Repositories must have a "name"`;
            if (repository.handler === undefined)
                throw `Repositories must have a "handler"`;
            if (repository.arguments === undefined)
                throw `Repositories must have a "arguments"`;

            let handlerClass = findAndLoadHandler(repository.handler);

            if (handlerClass === undefined) {
                throw `Unable to find handler: ${repository.handler}`;
            }

            if (handlerClass.default === undefined) {
                throw `Handler Class must be exported as default class`;
            }

            this.pendingCount++;

            handlerClass = handlerClass.default;
            const index = this.repositories.push({
                name: repository.name,
                instance: new handlerClass({
                    "name": repository.name,
                    ...repository.arguments
                })
            });

            this.repositories.find(repo => repo.name === repository.name).instance.on("ready", verifyState);
        })
    }

    get Repositories() {
        if (!this.ready) return undefined;
        return this.repositories;
    }

    findRepository(repositoryName) {
        if (!this.ready) return undefined;
        return this.repositories.find(repository => repository.name === repositoryName);
    }

    findPlugin(pluginName) {
        if (!this.ready) return undefined;
        let pluginObject = undefined;

        this.repositories.forEach(repository => {
            if (pluginObject === undefined)
                pluginObject = repository.instance.findPlugin(pluginName);
            else
                return undefined;
        });

        return pluginObject;
    }

    findRepositoryByPlugin(pluginName) {
        if (!this.ready) return undefined;
        return this.repositories.find(
            repository => repository.instance.PluginsList.find(
                plugin => plugin.name === pluginName
            ) !== null // return repository
        );
    }

    getPluginsForRepository(repositoryName) {
        if (!this.ready) return undefined;
        return this.repositories.find(repository => repository.name === repositoryName).PluginsList;
    }

    getPluginRepository(pluginName) {
        if (!this.ready) return undefined;
        let repo = undefined;

        return undefined;
    }
}