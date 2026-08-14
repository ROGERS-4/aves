module.exports = {
    name: 'alive',
    aliases: ['status'],
    category: 'main',
    description: 'Check if bot is alive',
    async execute(sock, mek, args, chatId, isOwner) {
        await sock.sendMessage(chatId, { 
            text: `✅ QUEEN BELLA MD V3 IS ALIVE!\n\n⏰ ${new Date().toLocaleString()}\n📱 Status: Online\n👑 Bot: Running smoothly`
        });
    }
};