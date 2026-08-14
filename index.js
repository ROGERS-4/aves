/**
 * 👑 QUEEN BELLA MD V3 - Protected Core
 * 🔒 DO NOT MODIFY
 */

require('dotenv').config();
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const express = require('express');
const pino = require('pino');

// Load user config
let config = {};
try {
    config = require('./config.js');
    console.log(chalk.green('✅ Config loaded successfully!'));
} catch (e) {
    console.log(chalk.yellow('⚠️ Using default config'));
    config = {
        prefix: ".",
        botName: "QUEEN BELLA MD V3",
        botOwner: "RODGERS",
        ownerNumber: "254755660053",
        mode: "public"
    };
}

// Global commands map
global.commands = new Map();

// Load protected commands
function loadCommands() {
    const commandsDir = path.join(__dirname, 'plugins');
    if (!fs.existsSync(commandsDir)) {
        console.log(chalk.red('❌ Plugins folder not found!'));
        return;
    }
    
    const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));
    console.log(chalk.cyan(`📦 Loading ${files.length} protected commands...`));
    
    let loadedCount = 0;
    for (const file of files) {
        try {
            const command = require(path.join(commandsDir, file));
            if (command && command.name) {
                global.commands.set(command.name.toLowerCase(), command);
                if (command.aliases) {
                    command.aliases.forEach(alias => {
                        global.commands.set(alias.toLowerCase(), command);
                    });
                }
                console.log(chalk.green(`✅ Loaded: ${command.name}`));
                loadedCount++;
            }
        } catch (error) {
            console.error(chalk.red(`❌ Failed to load ${file}:`), error.message);
        }
    }
    console.log(chalk.green(`✅ Loaded ${loadedCount} commands.`));
}

// Main bot class
class QueenBellaBot {
    constructor() {
        this.sock = null;
        this.sessionFolder = './session';
        this.isReady = false;
    }

    async start() {
        console.log(chalk.cyan(`
╔═══════════════════════════════════════╗
║   👑 QUEEN BELLA MD V3               ║
║   🔒 Protected Version               ║
║   Created by Dev RODGERS             ║
╚═══════════════════════════════════════╝
        `));

        loadCommands();
        await this.initializeWhatsApp();
        this.startWebServer();
    }

    async initializeWhatsApp() {
        if (!fs.existsSync(this.sessionFolder)) {
            fs.mkdirSync(this.sessionFolder, { recursive: true });
        }

        const { state, saveCreds } = await useMultiFileAuthState(this.sessionFolder);
        
        this.sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            browser: ['QUEEN BELLA MD', 'Chrome', '3.0.0'],
            markOnlineOnConnect: false,
            syncFullHistory: false,
            downloadHistory: false,
            logger: pino({ level: 'silent' }),
        });

        this.sock.ev.on('creds.update', saveCreds);
        this.setupEventHandlers();
        this.requestPairingCode();
    }

    async requestPairingCode() {
        let pairingDone = false;

        if (!this.sock.authState.creds.registered && !pairingDone) {
            pairingDone = true;
            let phoneNumber = config.ownerNumber || '254755660053';
            phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
            
            console.log(chalk.green(`📱 Using number: ${phoneNumber}`));
            console.log(chalk.yellow(`⏳ Requesting pairing code...`));

            setTimeout(async () => {
                try {
                    let code = await this.sock.requestPairingCode(phoneNumber);
                    code = code?.match(/.{1,4}/g)?.join('-') || code;
                    console.log('');
                    console.log(chalk.black(chalk.bgGreen(`✅ PAIRING CODE: ${code}`)));
                    console.log('');
                    console.log(chalk.yellow(`📱 Enter this code in WhatsApp Web/Linked Devices`));
                    console.log(chalk.cyan(`⏰ Code expires in 10 minutes`));
                    console.log('');
                    console.log(chalk.green(`🔄 Bot will connect automatically!`));
                    console.log('');
                } catch (error) {
                    console.error(chalk.red('❌ Error getting pairing code:'), error.message);
                }
            }, 5000);
        }
    }

    setupEventHandlers() {
        this.sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'open' && this.sock.authState.creds.registered) {
                this.isReady = true;
                console.log(chalk.green(`
╔═══════════════════════════════════════╗
║   ✅ BOT IS ONLINE!                  ║
║   👑 ${config.botName}               ║
║   📱 Connected successfully!         ║
╚═══════════════════════════════════════╝
                `));
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                if (statusCode === DisconnectReason.loggedOut) {
                    try {
                        fs.rmSync(this.sessionFolder, { recursive: true, force: true });
                        console.log(chalk.yellow('Session cleared. Re-pair needed.'));
                    } catch (e) {}
                }
                if (statusCode !== DisconnectReason.loggedOut) {
                    console.log(chalk.yellow('🔄 Reconnecting...'));
                    setTimeout(() => this.initializeWhatsApp(), 3000);
                }
            }
        });

        this.sock.ev.on('messages.upsert', async (chatUpdate) => {
            try {
                await this.handleMessage(chatUpdate);
            } catch (error) {
                console.error('Message error:', error);
            }
        });

        this.sock.ev.on('call', async (calls) => {
            for (const call of calls) {
                if (!call.from) continue;
                try {
                    await this.sock.sendMessage(call.from, {
                        text: '📞 Call rejected. Please message instead.'
                    });
                    await this.sock.updateBlockStatus(call.from, 'block');
                } catch (e) {}
            }
        });
    }

    async handleMessage(chatUpdate) {
        const mek = chatUpdate.messages[0];
        if (!mek || !mek.message) return;

        const chatId = mek.key.remoteJid;
        const isStatus = chatId === 'status@broadcast';
        const isChannel = chatId.includes('@newsletter');
        if (isStatus || isChannel) return;

        let text = '';
        if (mek.message.conversation) text = mek.message.conversation;
        else if (mek.message.extendedTextMessage) text = mek.message.extendedTextMessage.text;
        else if (mek.message.imageMessage) text = mek.message.imageMessage.caption || '';
        else if (mek.message.videoMessage) text = mek.message.videoMessage.caption || '';
        else return;
        if (!text) return;

        const prefix = config.prefix || '.';
        if (!text.startsWith(prefix)) return;

        const args = text.slice(1).trim().split(' ');
        const commandName = args.shift().toLowerCase();

        const sender = mek.key.participant || mek.key.remoteJid;
        const senderNumber = sender ? sender.split('@')[0] : '';
        const isOwner = senderNumber === config.ownerNumber;

        if (config.mode === 'private' && !isOwner) {
            await this.sock.sendMessage(chatId, {
                text: `🔒 Private mode. Only owner can use commands.`
            });
            return;
        }

        if (global.commands.has(commandName)) {
            const command = global.commands.get(commandName);
            try {
                await command.execute(this.sock, mek, args, chatId, isOwner);
                console.log(chalk.green(`✅ Executed: ${commandName}`));
            } catch (error) {
                console.error(chalk.red(`❌ Error executing ${commandName}:`), error);
                await this.sock.sendMessage(chatId, { 
                    text: '❌ Error executing command! Please try again.' 
                });
            }
        } else {
            await this.sock.sendMessage(chatId, { 
                text: `❌ Unknown command: ${text}\nType ${prefix}menu for available commands.` 
            });
        }
    }

    startWebServer() {
        const app = express();
        const PORT = process.env.PORT || 3000;

        app.get('/', (req, res) => {
            res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>QUEEN BELLA MD V3</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            text-align: center;
                            padding: 50px;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            margin: 0;
                            min-height: 100vh;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                        }
                        .container {
                            background: rgba(255,255,255,0.1);
                            backdrop-filter: blur(10px);
                            padding: 40px;
                            border-radius: 20px;
                            max-width: 600px;
                            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                        }
                        h1 {
                            font-size: 48px;
                            margin: 0;
                            text-shadow: 0 2px 10px rgba(0,0,0,0.3);
                        }
                        .status {
                            color: #4ade80;
                            font-weight: bold;
                            font-size: 24px;
                            margin: 20px 0;
                        }
                        .info {
                            background: rgba(0,0,0,0.2);
                            padding: 20px;
                            border-radius: 10px;
                            margin: 20px 0;
                            text-align: left;
                        }
                        .info-item {
                            padding: 8px 0;
                            border-bottom: 1px solid rgba(255,255,255,0.1);
                        }
                        .info-item:last-child {
                            border-bottom: none;
                        }
                        .emoji { font-size: 24px; }
                        hr {
                            border: none;
                            border-top: 2px solid rgba(255,255,255,0.2);
                            margin: 20px 0;
                        }
                        .footer {
                            font-size: 14px;
                            opacity: 0.8;
                        }
                        .badge {
                            display: inline-block;
                            background: #4ade80;
                            color: #000;
                            padding: 4px 12px;
                            border-radius: 20px;
                            font-size: 14px;
                            font-weight: bold;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>👑 QUEEN BELLA MD V3</h1>
                        <p style="font-size: 18px; opacity: 0.9;">Created by Dev RODGERS</p>
                        <div class="status">✅ Bot is Online!</div>
                        <span class="badge">Status: 200</span>
                        
                        <div class="info">
                            <div class="info-item"><span class="emoji">📱</span> <strong>Bot:</strong> ${config.botName}</div>
                            <div class="info-item"><span class="emoji">⚡</span> <strong>Prefix:</strong> ${config.prefix}</div>
                            <div class="info-item"><span class="emoji">👤</span> <strong>Owner:</strong> ${config.botOwner}</div>
                            <div class="info-item"><span class="emoji">🔒</span> <strong>Mode:</strong> ${config.mode}</div>
                            <div class="info-item"><span class="emoji">📊</span> <strong>Commands:</strong> ${global.commands.size}</div>
                        </div>
                        
                        <hr>
                        <p class="footer">© A BELLA BOTS PRODUCTIONS</p>
                        <p style="font-size: 12px; opacity: 0.6;">Protected Version 3.0.0</p>
                    </div>
                </body>
                </html>
            `);
        });

        app.listen(PORT, () => {
            console.log(chalk.green(`🌐 Web server running on port ${PORT}`));
        });
    }
}

// Start bot
const bot = new QueenBellaBot();
bot.start().catch(console.error);
