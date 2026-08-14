module.exports = {
    name: 'uptime',
    aliases: ['runtime'],
    category: 'main',
    description: 'Show bot uptime',
    async execute(sock, mek, args, chatId, isOwner) {
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        await sock.sendMessage(chatId, { 
            text: `⏰ Bot Uptime\n🕐 ${days}d ${hours}h ${minutes}m ${seconds}s`
        });
    }
};