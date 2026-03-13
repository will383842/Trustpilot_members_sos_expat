import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_DIR = path.join(__dirname, '..', 'auth_info');

// Numéro de téléphone pour le couplage (format international sans + ni espaces)
const PHONE_NUMBER = process.env.WA_PHONE_NUMBER; // ex: 33743331201

let sock = null;
let onGroupEventCallback = null;
let retryCount = 0;
const MAX_RETRY_DELAY = 60000; // 60s max

export function setGroupEventHandler(callback) {
  onGroupEventCallback = callback;
}

export function getSocket() {
  return sock;
}

export async function connectToWhatsApp() {
  if (!PHONE_NUMBER) {
    logger.error('WA_PHONE_NUMBER manquant dans .env (ex: 33743331201 sans le +)');
    process.exit(1);
  }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  logger.info({ version }, 'Connexion à WhatsApp avec Baileys');

  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: logger.child({ level: 'silent' }),
    browser: ['Trustpilot SOS-Expat', 'Chrome', '120.0.0'],
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, isNewLogin } = update;

    // Première connexion : demander le code de couplage par numéro
    if (isNewLogin && !state.creds.registered) {
      try {
        await new Promise((r) => setTimeout(r, 2000)); // attendre init socket
        const code = await sock.requestPairingCode(PHONE_NUMBER);
        const formatted = code.match(/.{1,4}/g)?.join('-') ?? code;
        logger.info('══════════════════════════════════════════════════');
        logger.info(`  CODE DE COUPLAGE WHATSAPP : ${formatted}`);
        logger.info('  Sur ton téléphone :');
        logger.info('  WhatsApp → Appareils connectés → Connecter');
        logger.info('  → Lier avec numéro de téléphone → Entrer le code');
        logger.info('══════════════════════════════════════════════════');
      } catch (err) {
        logger.error({ err }, 'Erreur lors de la demande du code de couplage');
      }
    }

    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      logger.warn({ statusCode }, 'Connexion fermée');

      if (shouldReconnect) {
        retryCount++;
        const delay = Math.min(MAX_RETRY_DELAY, 5000 * Math.pow(2, retryCount - 1));
        logger.info({ delay, retryCount }, 'Reconnexion dans %d ms...', delay);
        setTimeout(connectToWhatsApp, delay);
      } else {
        logger.error(
          'Déconnecté de WhatsApp (logout). Supprime le dossier auth_info/ et redémarre.'
        );
        process.exit(1);
      }
    }

    if (connection === 'open') {
      retryCount = 0;
      logger.info('Connexion WhatsApp établie avec succès');
    }
  });

  // Clean up previous listeners before re-registering (prevents memory leak on reconnection)
  sock.ev.removeAllListeners('group-participants.update');

  sock.ev.on('group-participants.update', async (event) => {
    logger.info({ event }, 'Événement participant de groupe reçu');
    if (onGroupEventCallback) {
      await onGroupEventCallback(event);
    }
  });

  return sock;
}
