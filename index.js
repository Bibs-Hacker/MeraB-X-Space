const {
 default: makeWASocket,
 useMultiFileAuthState,
 DisconnectReason,
 fetchLatestBaileysVersion,
 makeInMemoryStore,
 jidDecode,
 downloadContentFromMessage
} = require("@whiskeysockets/baileys")

const Pino = require("pino")
const fs = require("fs")
const path = require("path")
const chalk = require("chalk")

// ==========================================
// MeraB-X-Space Configuration
// ==========================================

const OWNER_NAME = "The Dog's Family"
const OWNER_NUMBER = "254769845908"
const BOT_NAME = "MeraB-X-Space"
const PREFIX = "."

// ==========================================
// Store
// ==========================================

const store = makeInMemoryStore({
 logger: Pino().child({
 level: "silent",
 stream: "store"
 })
})

// ==========================================
// Banner
// ==========================================

function startBanner() {

console.clear()

console.log(chalk.red(`
╔══════════════════════════════════════╗
║                                      ║
║         🌌 MeraB-X-Space 🌌          ║
║                                      ║
║      Advanced WhatsApp Bot           ║
║                                      ║
╚══════════════════════════════════════╝
`))

console.log(chalk.green(`
╭───────────────────────────────╮
│ OWNER : ${OWNER_NAME}
│ PREFIX: ${PREFIX}
│ STATUS: STARTING...
╰───────────────────────────────╯
`))

}

// ==========================================
// Start Bot
// ==========================================

async function startBot() {

startBanner()

const { state, saveCreds } =
await useMultiFileAuthState("./session")

const { version } =
await fetchLatestBaileysVersion()

const sock = makeWASocket({

version,

logger: Pino({
 level: "silent"
}),

printQRInTerminal: false,

browser: [
 "MeraB-X-Space",
 "Chrome",
 "1.0.0"
],

auth: state

})

// ==========================================
// Pairing Code
// ==========================================

if (!sock.authState.creds.registered) {

const code =
await sock.requestPairingCode(OWNER_NUMBER)

console.log(chalk.yellow(`
╔══════════════════════════════╗
      🔑 PAIRING CODE 🔑
╚══════════════════════════════╝

${code}

Link Device Using Phone Number.
`))

}

// ==========================================
// Save Session
// ==========================================

sock.ev.on("creds.update", saveCreds)

// ==========================================
// Connection Updates
// ==========================================

sock.ev.on("connection.update", async(update) => {

const {
 connection,
 lastDisconnect
} = update

if (connection === "open") {

console.log(chalk.green(`
╔══════════════════════════════╗
   ✅ BOT CONNECTED SUCCESSFULLY
╚══════════════════════════════╝
`))

}

else if (connection === "close") {

let reason =
lastDisconnect?.error?.output?.statusCode

console.log(chalk.red(`
❌ Connection Closed
Reason: ${reason}
`))

if (reason !== DisconnectReason.loggedOut) {
 startBot()
}

}

})

// ==========================================
// Message Handler
// ==========================================

sock.ev.on("messages.upsert", async(chatUpdate) => {

try {

const mek = chatUpdate.messages[0]

if (!mek.message) return

const from = mek.key.remoteJid

const type = Object.keys(mek.message)[0]

const body =
mek.message.conversation ||
mek.message.extendedTextMessage?.text ||
mek.message.imageMessage?.caption ||
mek.message.videoMessage?.caption ||
""

const isCmd = body.startsWith(PREFIX)

const command =
body.slice(1).trim().split(/ +/).shift().toLowerCase()

const args = body.trim().split(/ +/).slice(1)

const pushname = mek.pushName || "User"

console.log(chalk.cyan(`
╭───────────────
│ MESSAGE RECEIVED
├───────────────
│ FROM : ${pushname}
│ MSG  : ${body}
╰───────────────
`))

// ==========================================
// MENU COMMAND
// ==========================================

if (command === "menu") {

let menuText = `
╔═══『 🌌 MeraB-X-Space 🌌 』
║
║ 👑 Owner : ${OWNER_NAME}
║ ⚡ Prefix : ${PREFIX}
║ 🤖 Mode : Public
║
╠═══『 MAIN COMMANDS 』
║
║ ${PREFIX}menu
║ ${PREFIX}ping
║ ${PREFIX}alive
║ ${PREFIX}owner
║ ${PREFIX}runtime
║
╠═══『 FUN COMMANDS 』
║
║ ${PREFIX}truth
║ ${PREFIX}dare
║ ${PREFIX}quote
║ ${PREFIX}joke
║
╠═══『 AI COMMANDS 』
║
║ ${PREFIX}ai
║ ${PREFIX}gpt
║
╠═══『 GROUP COMMANDS 』
║
║ ${PREFIX}tagall
║ ${PREFIX}kick
║ ${PREFIX}mute
║
╠═══『 MEDIA COMMANDS 』
║
║ ${PREFIX}sticker
║ ${PREFIX}play
║ ${PREFIX}ytmp3
║
╚═══════════════════╝

⚡ Powered By MeraB-X-Space
`

await sock.sendMessage(from, {

image: {
 url: "https://files.catbox.moe/7x6n5p.jpg"
},

caption: menuText,

footer: "MeraB-X-Space",

buttons: [

{
buttonId: ".ping",
buttonText: {
 displayText: "🏓 Ping"
},
type: 1
},

{
buttonId: ".owner",
buttonText: {
 displayText: "👑 Owner"
},
type: 1
},

{
buttonId: ".alive",
buttonText: {
 displayText: "⚡ Alive"
},
type: 1
}

],

headerType: 4

})

}

// ==========================================
// PING COMMAND
// ==========================================

if (command === "ping") {

await sock.sendMessage(from, {
text: "🏓 Pong! Bot is active."
})

}

// ==========================================
// ALIVE COMMAND
// ==========================================

if (command === "alive") {

await sock.sendMessage(from, {
text: `
╔══════════════════════╗
     ⚡ BOT STATUS ⚡
╚══════════════════════╝

✅ Bot Online
✅ Server Active
✅ Baileys Connected
✅ MeraB-X-Space Running
`
})

}

// ==========================================
// OWNER COMMAND
// ==========================================

if (command === "owner") {

await sock.sendMessage(from, {

contacts: {
displayName: OWNER_NAME,
contacts: [{
vcard:
`BEGIN:VCARD
VERSION:3.0
FN:${OWNER_NAME}
TEL;type=CELL;type=VOICE;waid=${OWNER_NUMBER}:${OWNER_NUMBER}
END:VCARD`
}]
}

})

}

// ==========================================
// SIMPLE AUTO REPLY
// ==========================================

if (body === "hi") {

await sock.sendMessage(from, {
text: `Hello ${pushname} 👋`
})

}

} catch (err) {

console.log(chalk.red(err))

}

})

}

// ==========================================
// Anti Crash
// ==========================================

process.on("uncaughtException", console.error)
process.on("unhandledRejection", console.error)

// ==========================================
// Start
// ==========================================

startBot()
