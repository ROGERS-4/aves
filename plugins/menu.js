module.exports = {
    name: 'menu',
    aliases: ['help', 'cmds'],
    category: 'main',
    description: 'Show all available commands',
    async execute(sock, mek, args, chatId, isOwner) {
        const commands = global.commands || new Map();
        const seen = new Set();
        let menu = `👑 QUEEN BELLA MD V3\n📱 WhatsApp Bot\n\n📋 COMMANDS:\n\n`;
        let count = 0;
        
        for (const [name, cmd] of commands) {
            if (!seen.has(name) && cmd.name === name) {
                seen.add(name);
                menu += `.${cmd.name} - ${cmd.description || 'No description'}\n`;
                count++;
            }
        }
        
        menu += `\n📊 Total: ${count} commands\n© BELLA BOTS`;
        await sock.sendMessage(chatId, { text: menu });
    }
};
