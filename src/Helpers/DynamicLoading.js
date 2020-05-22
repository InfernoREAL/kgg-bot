import path from "path";
import * as fs from "fs";

export default (basePath, targetFile, caseInsensitive = false) => {
    let returnValue = null;

    if (targetFile === undefined)
        throw `targetFile can't be undefined`;
    if (targetFile === null)
        throw `targetFile can't be null`;
    if (targetFile.length === 0)
        throw `targetFile must be set`;

    fs.readdirSync(path.resolve(basePath)).forEach(file => {
        if (file.substr(-3, 3) === '.js') {
            let isThisFile;
            if (caseInsensitive) {
                isThisFile = file.toLowerCase().startsWith(targetFile.toLowerCase());
            } else {
                isThisFile = file.startsWith(targetFile);
            }

            if (isThisFile) {
                const filename = file.substring(0, file.lastIndexOf('.'));
                const importPath = path.resolve(path.relative(".", path.join(basePath, filename)));

                returnValue = require(importPath);
            }
        }
    });

    return returnValue;
}