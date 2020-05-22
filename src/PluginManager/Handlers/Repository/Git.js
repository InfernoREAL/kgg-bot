import BaseHandler from "./BaseHandler";
import gitClientBase from "simple-git";
import path from "path";
import fs from "fs";

export default class Git extends BaseHandler {
    constructor(info) {
        super(info, process.env.KGGREPOSITORIESPATH);

        if (!fs.existsSync(this.InstallPath)) {
            fs.mkdirSync(this.InstallPath);
            this.firstRun = true;
            return;
        }

        const gitPath = path.join(this.InstallPath, '.git');

        if (!fs.existsSync(gitPath)) {
            this.firstRun = true;
        }

        const gitClient = gitClientBase(this.InstallPath);

        const checkForUpdates = (gitClient) => {
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
                        gitClient.pull(err => {
                            if (err !== null) {
                                this.emit('failure', err);
                                return undefined;
                            }
                            this.emit("ready");
                        });
                    } else {
                        this.emit("ready");
                    }
                })
            });
        };

        if (this.firstRun) {
            gitClient.clone(info.url, '.', err => {
                if (err !== null) {
                    this.emit('failure', err);
                    return undefined;
                }

                checkForUpdates(gitClient);
            });
        } else {
            checkForUpdates(gitClient);
        }
    }
}