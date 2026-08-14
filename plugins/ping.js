module.exports = {
    name: 'ping',
    aliases: ['p'],
    category: 'main',
    description: 'Check bot response time',
    async execute(sock, mek, args, chatId, isOwner) {
        const start = Date.now();
        await sock.sendMessage(chatId, { text: '🏓 Pinging...' });
        const end = Date.now();
        await sock.sendMessage(chatId, { 
            text: `🏓 Pong!\n⏱️ ${end - start}ms` 
        });
    }
};
