import { getSocket } from './whatsapp.js';
import logger from './logger.js';

/**
 * Fetch groups with a timeout to prevent hanging.
 */
async function fetchGroupsWithTimeout(sock, timeoutMs = 30000) {
  return Promise.race([
    sock.groupFetchAllParticipating(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Group fetch timed out')), timeoutMs)
    )
  ]);
}

/**
 * Fetch all groups and their participants from WhatsApp.
 * Returns an array of { groupId, name, participants[] } objects.
 */
export async function fetchAllGroups() {
  const sock = getSocket();
  if (!sock) throw new Error('WhatsApp socket not initialized');

  logger.info('Fetching all joined groups...');
  const groups = await fetchGroupsWithTimeout(sock);
  const groupList = Object.values(groups);

  logger.info({ count: groupList.length }, 'Groups fetched');

  return groupList.map((g) => ({
    groupId: g.id,
    name: g.subject,
    participants: g.participants.map((p) => ({
      phone: p.id.replace('@s.whatsapp.net', '').replace('@c.us', ''),
      rawId: p.id,
      isAdmin: p.admin === 'admin' || p.admin === 'superadmin',
    })),
  }));
}

/**
 * Detect language from group name heuristics.
 * Falls back to 'fr' if no match.
 */
export function detectLanguageFromGroupName(name) {
  // Normalize: lowercase + strip diacritics (é→e, è→e, ô→o, etc.)
  const n = name.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  if (n.includes('allemagne') || n.includes('osterreich') || n.includes('austria') || n.includes('schweiz') || n.includes('wien')) return 'de';
  if (n.includes('brasil') || n.includes('portugal') || n.includes('angola') || n.includes('mozambique')) return 'pt';
  if (n.includes('espagne') || n.includes('spain') || n.includes('mexico') || n.includes('mexique') || n.includes('argentina') || n.includes('colombia')) return 'es';
  if (n.includes('italie') || n.includes('italy') || n.includes('italia')) return 'it';
  if (n.includes('nederland') || n.includes('belgique fl') || n.includes('belgie')) return 'nl';
  if (n.includes('maroc') || n.includes('algerie') || n.includes('tunisie') || n.includes('egypte') || n.includes('arab') || n.includes('moyen-orient') || n.includes('dubai') || n.includes('qatar') || n.includes('saudi')) return 'ar';
  if (n.includes('chine') || n.includes('china') || n.includes('taiwan') || n.includes('hong kong') || n.includes('singapo')) return 'zh';
  if (n.includes('uk') || n.includes('england') || n.includes('usa') || n.includes('australie') || n.includes('australia') || n.includes('canada') || n.includes('london') || n.includes('new york')) return 'en';
  return 'fr';
}

/**
 * Detect country from group name heuristics.
 */
export function detectCountryFromGroupName(name) {
  const n = name.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  const mapping = {
    'france': 'France', 'belgique': 'Belgique', 'suisse': 'Suisse',
    'maroc': 'Maroc', 'algerie': 'Algérie', 'tunisie': 'Tunisie',
    'allemagne': 'Allemagne', 'espagne': 'Espagne', 'italie': 'Italie',
    'portugal': 'Portugal', 'brasil': 'Brésil', 'mexique': 'Mexique',
    'canada': 'Canada', 'usa': 'USA', 'uk': 'Royaume-Uni',
    'australie': 'Australie', 'dubai': 'Émirats Arabes Unis',
    'qatar': 'Qatar', 'chine': 'Chine', 'japon': 'Japon',
    'senegal': 'Sénégal', 'cote d\'ivoire': 'Côte d\'Ivoire',
  };
  for (const [key, value] of Object.entries(mapping)) {
    if (n.includes(key)) return value;
  }
  return null;
}

/**
 * Detect continent from country.
 */
export function detectContinent(country) {
  const europeCountries = ['France', 'Belgique', 'Suisse', 'Allemagne', 'Espagne', 'Italie', 'Portugal', 'Royaume-Uni', 'Pays-Bas'];
  const africaCountries = ['Maroc', 'Algérie', 'Tunisie', 'Sénégal', 'Côte d\'Ivoire'];
  const americasCountries = ['USA', 'Canada', 'Brésil', 'Mexique', 'Argentine', 'Colombie'];
  const asiaCountries = ['Chine', 'Japon', 'Émirats Arabes Unis', 'Qatar', 'Singapour'];
  const oceaniaCountries = ['Australie', 'Nouvelle-Zélande'];

  if (europeCountries.includes(country)) return 'Europe';
  if (africaCountries.includes(country)) return 'Afrique';
  if (americasCountries.includes(country)) return 'Amériques';
  if (asiaCountries.includes(country)) return 'Asie';
  if (oceaniaCountries.includes(country)) return 'Océanie';
  return null;
}
