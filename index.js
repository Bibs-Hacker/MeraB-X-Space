const {
 default: makeWASocket,
 useMultiFileAuthState,
 DisconnectReason,
 fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys")

const pino = require("pino")

async function startBot() {

 const { state, saveCreds } =
 await useMultiFileAuthState("session")

 const { version } =
 await fetchLatestBaileysVersion()

 const sock = makeWASocket({
 version,
 auth: state,
 logger: pino({ level: "silent" })
 })

 sock.ev.on("creds.update", saveCreds)

 // Pairing Code
 if (!sock.authState.creds.registered) {

 const phoneNumber = "254769845908"

 const code =
 await sock.requestPairingCode(phoneNumber)

 console.log(`
╔══════════════════════╗
   MeraB-X-Space
╚══════════════════════╝

PAIRING CODE:
${code}

`)
 }

 sock.ev.on("connection.update", ({ connection }) => {

 if (connection === "open") {
 console.log("✅ BOT CONNECTED")
 }

 })

}

startBot()
