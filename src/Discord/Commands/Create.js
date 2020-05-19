const CommandBase = require('../Discord.Commands');

module.exports = class CreateVoiceHostCommand extends CommandBase {
    constructor() {
        super(CreateVoiceHostCommand);
    }

    execute() {
        if (this.msg === undefined) {
            return;
        }

        const msg = this.msg;

        msg.reply("");
    }
};