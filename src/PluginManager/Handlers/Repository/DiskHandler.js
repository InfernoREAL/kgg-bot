import path from "path";
import fs from "fs";
import BaseHandler from "./BaseHandler";

export default class DiskHandler extends BaseHandler {

    log = (...msg) => {
        (console.log).apply(console.log, ["[Repository Handler]", ...msg]);
    };

    constructor(info) {
        super(info, process.env.KGGREPOSITORIESPATH);
    }
}