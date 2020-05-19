const fs = require('fs');
const path = require('path');

const classesPath = path.join(__dirname, "Commands");
let count = 0;
let commandsString = [];

const loadClasses = () => {
    let classes = {};

    fs.readdirSync(classesPath).forEach(file => {
        if (file.substr(-3, 3) === '.js') {
            const reqPath = path.join(classesPath, file);
            const filename = file.substring(0, file.lastIndexOf('.'));

            if (!classes.hasOwnProperty(filename)) {
                classes[filename] = new (require(reqPath))();
                commandsString.push(classes[filename].getCommandName());
                count++;
            }
        }
    });

    return classes;
};

const commands = loadClasses();

module.exports = class DiscordCommandsDictionary {
    constructor(prefix) {
        this.commands = commands;
        this.count = count;
        this.prefix = prefix === undefined ? '' : prefix;
    }

    getCommandsCount() {
        return this.count;
    }

    fetchCommandsObject() {
        return this.commands;
    }

    fetchCommands() {
        return commandsString;
    }

    messageSent(message) {
        let content = message.content;
        const prefix = content.substr(0, this.prefix.length);

        if (this.prefix.length > 0) {
            if (prefix !== this.prefix) {
                return;
            }
        }

        content = content.substr(this.prefix.length);
        let isHelpMessage = false;
        let helpStack = '\r\n';

        for(let key in this.commands) {
            if (this.commands.hasOwnProperty(key)) {
                if (content.startsWith('help')) {
                    if (!isHelpMessage)
                        isHelpMessage = true;

                    helpStack += `\r\n${this.commands[key].helpMessage(this.prefix)}`;
                }
                else {
                    this.commands[key].test(message);
                }
            }
        }

        if (isHelpMessage) {
            message.reply(helpStack);
        }

    }
};