const getCommandName = function(obj) {
    const objString = obj.toString();
    const objMatch = objString.match(/ (\w+)/);

    return objMatch[1].split("Command")[0];
};

module.exports = class DiscordCommand {
    constructor(command, args) {
        this.command = getCommandName(command);

        if (args !== undefined) {
            if (!Array.isArray(args)) {
                throw "[DiscordCommand Base] args must be an array";
            }

            this.args = args;
        } else {
            this.args = [];
        }
    }

    getCommandName() {
        return this.command;
    }

    getCommandArgs() {
        return this.args;
    }

    test(message) {
        const content = message.content;
        const commandPosition = content.lastIndexOf(this.command);
        if (commandPosition === -1) {
            return;
        }

        const args = content.substr(commandPosition);

        if (this.args.length > 0) {
            if (args.split(' ').length !== this.args.length) {
                return;
            }
        }

        this.msg = message;
        this.execute();
        this.msg = undefined;
    }

    helpMessage(prefix) {
        return `How to use ${this.command}: **${prefix}${this.command} ${this.args.join(', ')}**`;
    }

    execute() {

    }
};