module.exports = {
    name: 'owner',
    aliases: ['creator', 'dev'],
    category: 'main',
    description: 'Show bot owner info',
    async execute(sock, mek, args, chatId, isOwner) {
        await sock.sendMessage(chatId, { 
            text: `👑 QUEEN BELLA MD V3\nCreated by RODGERS\n📱 wa.me/254755660053\n© BELLA BOTS`
        });
    }
};