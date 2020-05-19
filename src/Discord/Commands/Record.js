const CommandBase = require('../Discord.Commands');

module.exports = class RecordCommand extends CommandBase {
    constructor() {
        super(RecordCommand, ["channelId"]);
    }

    execute() {
        if (this.msg === undefined) {
            return;
        }

        const msg = this.msg;

        msg.reply("");
    }
};