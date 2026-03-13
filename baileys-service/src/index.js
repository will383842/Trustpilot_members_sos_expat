import { config } from 'dotenv';
config();

import { connectToWhatsApp, setGroupEventHandler, getSocket } from './whatsapp.js';
import { fetchAllGroups } from './groups.js';
import { syncGroups, syncMembersBatch, sendGroupEvent, pingHealth } from './sync.js';
import logger from './logger.js';

// Validate critical env vars at startup
if (!process.env.LARAVEL_API_KEY || process.env.LARAVEL_API_KEY === 'CHANGE_ME_STRONG_SECRET') {
  logger.error('LARAVEL_API_KEY is not set or still has default value. Exiting.');
  process.exit(1);
}

const RESYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const HEALTH_PING_INTERVAL_MS = 60 * 1000; // 1 minute

function gracefulShutdown(signal) {
  logger.info({ signal }, 'Received %s, shutting down gracefully...', signal);
  const sock = getSocket();
  if (sock) {
    sock.end(undefined);
  }
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

async function initialSync() {
  try {
    logger.info('Starting initial full sync...');
    const groups = await fetchAllGroups();
    await syncGroups(groups);
    await syncMembersBatch(groups);
    logger.info('Initial sync complete');
  } catch (err) {
    logger.error({ err: err.message }, 'Initial sync failed');
  }
}

async function handleGroupEvent(event) {
  try {
    const sock = getSocket();
    let groupMetadata = null;
    try {
      groupMetadata = await sock.groupMetadata(event.id);
    } catch {
      logger.warn({ groupId: event.id }, 'Could not fetch group metadata');
    }
    await sendGroupEvent(event, groupMetadata);
  } catch (err) {
    logger.error({ err: err.message }, 'Error handling group event');
  }
}

async function main() {
  logger.info('Baileys Trustpilot Service starting...');

  setGroupEventHandler(handleGroupEvent);

  const sock = await connectToWhatsApp();

  // Wait for connection to be open before syncing
  await new Promise((resolve) => {
    const check = setInterval(() => {
      if (sock.user) {
        clearInterval(check);
        resolve();
      }
    }, 1000);
    setTimeout(() => { clearInterval(check); resolve(); }, 30000);
  });

  if (sock.user) {
    logger.info({ user: sock.user.id }, 'Connected as');
    await initialSync();
  }

  // Resync every 24 hours
  setInterval(async () => {
    logger.info('Starting scheduled resync...');
    await initialSync();
  }, RESYNC_INTERVAL_MS);

  // Health ping every minute
  setInterval(async () => {
    const connected = !!getSocket()?.user;
    await pingHealth(connected);
  }, HEALTH_PING_INTERVAL_MS);
}

main().catch((err) => {
  logger.error({ err: err.message }, 'Fatal error');
  process.exit(1);
});
