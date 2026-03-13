import axios from 'axios';
import { config } from 'dotenv';
import logger from './logger.js';
import { detectLanguageFromGroupName, detectCountryFromGroupName, detectContinent } from './groups.js';

config();

const api = axios.create({
  baseURL: process.env.LARAVEL_API_URL,
  headers: {
    'X-API-Key': process.env.LARAVEL_API_KEY,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

const CHUNK_SIZE = 100;

/**
 * Sync all groups metadata to Laravel.
 */
export async function syncGroups(groups) {
  logger.info({ count: groups.length }, 'Syncing groups to Laravel...');
  try {
    const payload = groups.map((g) => ({
      whatsapp_group_id: g.groupId,
      name: g.name,
      language: detectLanguageFromGroupName(g.name),
      country: detectCountryFromGroupName(g.name),
      continent: detectContinent(detectCountryFromGroupName(g.name)),
      member_count: g.participants.length,
    }));
    await api.post('/api/sync/groups', { groups: payload });
    logger.info('Groups synced successfully');
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to sync groups');
  }
}

/**
 * Sync all members in batch (chunked) to Laravel.
 */
export async function syncMembersBatch(groups) {
  const allMembers = [];

  for (const group of groups) {
    for (const participant of group.participants) {
      allMembers.push({
        phone: participant.phone,
        display_name: null,
        group_id: group.groupId,
        group_name: group.name,
        language: detectLanguageFromGroupName(group.name),
        country: detectCountryFromGroupName(group.name),
        continent: detectContinent(detectCountryFromGroupName(group.name)),
      });
    }
  }

  logger.info({ total: allMembers.length, chunkSize: CHUNK_SIZE }, 'Starting batch member sync...');

  for (let i = 0; i < allMembers.length; i += CHUNK_SIZE) {
    const chunk = allMembers.slice(i, i + CHUNK_SIZE);
    try {
      await api.post('/api/sync/members/batch', { members: chunk });
      logger.info({ from: i + 1, to: Math.min(i + CHUNK_SIZE, allMembers.length), total: allMembers.length }, 'Chunk synced');
    } catch (err) {
      logger.error({ err: err.message, chunk: i }, 'Failed to sync chunk');
    }
  }

  logger.info('Batch sync complete');
}

/**
 * Send a real-time group event (join / leave / name-change) to Laravel.
 */
export async function sendGroupEvent(event, groupMetadata) {
  const { id: groupId, participants, action } = event;
  const groupName = groupMetadata?.subject || '';

  for (const participantId of participants) {
    const phone = participantId.replace('@s.whatsapp.net', '').replace('@c.us', '');

    const payload = {
      phone,
      group_id: groupId,
      group_name: groupName,
      action, // 'add' | 'remove' | 'promote' | 'demote'
      language: detectLanguageFromGroupName(groupName),
      country: detectCountryFromGroupName(groupName),
      continent: detectContinent(detectCountryFromGroupName(groupName)),
    };

    try {
      await api.post('/api/sync/members/event', payload);
      logger.info({ phone, action, groupId }, 'Event sent to Laravel');
    } catch (err) {
      logger.error({ err: err.message, phone, action }, 'Failed to send event');
    }
  }
}

/**
 * Ping Laravel healthcheck endpoint.
 */
export async function pingHealth(isConnected) {
  try {
    await api.post('/api/sync/health', {
      connected: isConnected,
      last_ping: new Date().toISOString(),
    });
  } catch (err) {
    logger.warn({ err: err.message }, 'Health ping failed');
  }
}
